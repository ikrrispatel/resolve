import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createServer} from '../apps/api/src/server';
import {initialState,reduceEvent} from '../packages/core/reducer';
import {ResolutionReceiptSchema,type ResolveEvent} from '../packages/core/schemas';
const {server,origin}=await createServer(4317);
const records:unknown[]=[];const signatures=new Set<string>();const runIds=new Set<string>();
mkdirSync('outputs/backend-readiness',{recursive:true});
async function replay(runId:string,tape:ResolveEvent[]){
 const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),5000);
 try{const r=await fetch(`${origin}/api/runs/${runId}/events`,{signal:abort.signal});assert.equal(r.status,200);const reader=r.body!.getReader();let text='';const observed:ResolveEvent[]=[];const decoder=new TextDecoder();while(observed.length<tape.length){const chunk=await reader.read();assert(!chunk.done);text+=decoder.decode(chunk.value,{stream:true});let end;while((end=text.indexOf('\n\n'))!==-1){const frame=text.slice(0,end);text=text.slice(end+2);const data=frame.split('\n').find(l=>l.startsWith('data: '));if(data)observed.push(JSON.parse(data.slice(6)));}}await reader.cancel();assert.deepEqual(observed,tape);
 let state=initialState;for(const e of observed)state=reduceEvent(state,e);const final=state;for(const e of observed)state=reduceEvent(state,e);assert.deepEqual(state,final,'duplicate replay changed state');return final;
 }finally{clearTimeout(timeout);abort.abort();}
}
try{
 for(const kind of ['policy','evidence','abstain','receipt-gate'] as const){
  for(let n=1;n<=(kind==='receipt-gate'?1:3);n++){
   const response=await fetch(origin+'/api/runs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenario:kind==='receipt-gate'?'evidence':kind,agent:true,minimumPrice:975,maxTotal:kind==='receipt-gate'?.001:.05})});
   assert.equal(response.status,202);const {runId}=await response.json();assert(!runIds.has(runId));runIds.add(runId);let tape:ResolveEvent[]=[];const deadline=Date.now()+150000;
   do{tape=await (await fetch(`${origin}/api/runs/${runId}`)).json();if(tape.some(e=>e.type==='AGENT_RESUMED'||e.type==='ABSTAINED'))break;await new Promise(r=>setTimeout(r,300));}while(Date.now()<deadline);
   writeFileSync(`outputs/backend-readiness/${kind}-${n}.json`,JSON.stringify(tape,null,2));
   assert(tape.length>0);assert(tape.every((e,i)=>e.runId===runId&&e.sequence===i));
   const types=tape.map(e=>e.type),payments=tape.filter(e=>e.type==='PAYMENT_SETTLED'),receipts=tape.filter(e=>e.type==='RECEIPT_ISSUED'),resumes=tape.filter(e=>e.type==='AGENT_RESUMED');
   assert.equal(types[0],'EXCEPTION_CREATED');assert.equal(tape[0].data.agentRuntime,'OpenAI Agents JS');assert(types.includes('CONTRACT_CREATED'));
   for(const e of payments){assert.equal(e.data.network,'sandbox');assert.equal(typeof e.data.transaction,'string');assert(!signatures.has(String(e.data.transaction)));signatures.add(String(e.data.transaction));}
   if(kind==='policy'||kind==='evidence'){
    assert.equal(receipts.length,1);assert.equal(resumes.length,1);assert(types.indexOf('VALIDATION_PASSED')<types.indexOf('RECEIPT_ISSUED'));assert(types.indexOf('RECEIPT_ISSUED')<types.indexOf('AGENT_RESUMED'));
    const receipt=ResolutionReceiptSchema.parse(receipts[0].data.receipt);assert.equal(receipt.network,'sandbox');assert.equal(resumes[0].data.receiptId,receipt.id);assert.equal(resumes[0].data.runtime,'OpenAI Agents JS');
    if(kind==='policy'){assert.equal(payments.length,1);assert.equal(receipt.result.counter_offer,975);assert.equal(receipt.result.share_address,false);assert.equal(resumes[0].data.message,'I can do $975. If that works, I can send a public pickup location.');assert(!String(resumes[0].data.message).includes('123 Private Lane'));}
    else{assert.equal(payments.length,2);assert(types.indexOf('VALIDATION_FAILED')<types.indexOf('ESCALATING'));assert(types.indexOf('ESCALATING')<types.indexOf('VALIDATION_PASSED'));assert.equal(tape.filter(e=>e.type==='RESOLVER_SELECTED').length,2);const fail=tape.find(e=>e.type==='VALIDATION_FAILED')!;assert.deepEqual(fail.data.checks,{text_evidence:true,logo_or_label_evidence:false,product_or_web_entity_evidence:false});assert.equal(receipt.result.provider,'SYNTHETIC_RICH_FIXTURE');}
   }else{assert.equal(receipts.length,0);assert.equal(resumes.length,0);assert.equal(types.at(-1),'ABSTAINED');assert.equal(payments.length,kind==='abstain'?0:1);if(kind==='abstain'){assert.equal(tape.at(-1)!.data.spent,0);assert(!types.includes('PAYMENT_AUTHORIZED'));}else{assert(types.includes('VALIDATION_FAILED'));assert(!types.includes('VALIDATION_PASSED'));assert.equal(tape.at(-1)!.data.spent,.001);}}
   for(let i=0;i<3;i++){const replayed=await replay(runId,tape);assert.equal(replayed.events.length,tape.length);assert.equal(replayed.spent,payments.reduce((s,e)=>s+Number(e.data.amount),0));assert.deepEqual(await (await fetch(`${origin}/api/runs/${runId}`)).json(),tape,'replay created backend events');}
   assert.equal((await fetch(origin+'/api/reset',{method:'POST'})).status,200);assert.equal((await fetch(`${origin}/api/runs/${runId}`)).status,404);assert.equal((await fetch(`${origin}/api/runs/${runId}/events`)).status,404);assert.deepEqual(initialState,{stage:'RUNNING',events:[],spent:0,checks:{}});
   const record={kind,run:n,status:'PASS',runId,sandboxSettlements:payments.map(e=>e.data),receiptCount:receipts.length,resumeCount:resumes.length,replaysVerified:3,resetVerified:true,providerPayload:'DETERMINISTIC',agent:'LIVE_OPENAI'};records.push(record);writeFileSync('outputs/backend-readiness/summary.json',JSON.stringify({status:'IN_PROGRESS',records},null,2));console.log(`${kind} ${n}: PASS; payments=${payments.length}, receipt=${receipts.length}, resume=${resumes.length}; replay x3/reset PASS`);
  }
 }
 writeFileSync('outputs/backend-readiness/summary.json',JSON.stringify({status:'PASS',network:'SANDBOX_ONLY',providerPayloads:'DETERMINISTIC',records},null,2));
}catch(error){writeFileSync('outputs/backend-readiness/summary.json',JSON.stringify({status:'FAIL',error:String(error),records},null,2));throw error;}finally{server.close();}
