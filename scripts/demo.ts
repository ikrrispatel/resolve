import {createServer} from '../apps/api/src/server';
import {writeFileSync,mkdirSync} from 'node:fs';
import type {ResolveEvent} from '../packages/core/schemas';
const kind=process.argv[2]??'policy',agent=process.argv.includes('--agent');
if(kind==='evidence')console.log('SANDBOX FIXTURE FALLBACK: synthetic provider evidence, real sandbox settlement. NOT a live Pay catalog purchase.');
const {server,origin}=await createServer(4315);
try{
 const start=await fetch(origin+'/api/runs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenario:kind,agent})});
 if(!start.ok)throw Error(`RUN_START_FAILED_${start.status}`);
 const {runId}=await start.json();let seen=0,finished=false;
 for(let i=0;i<300;i++){
  const events:ResolveEvent[]=await (await fetch(origin+'/api/runs/'+runId)).json();
  for(const e of events.slice(seen))console.log(e.type,JSON.stringify(e.data));seen=events.length;
  if(events.some(e=>(agent?['AGENT_RESUMED','ABSTAINED']:['RECEIPT_ISSUED','ABSTAINED']).includes(e.type))){
   mkdirSync('outputs',{recursive:true});writeFileSync(`outputs/${kind}-event-proof.json`,JSON.stringify({mode:kind==='evidence'?'SANDBOX_FIXTURE_FALLBACK':'SANDBOX_POLICY',events},null,2));
   const types=events.map(e=>e.type);
   const success=kind==='abstain'?types.includes('ABSTAINED')&&!types.includes('PAYMENT_SETTLED'):types.includes('RECEIPT_ISSUED')&&(!agent||types.includes('AGENT_RESUMED'))&&(kind!=='evidence'||types.includes('VALIDATION_FAILED')&&types.includes('ESCALATING')&&types.filter(t=>t==='PAYMENT_SETTLED').length===2);
   if(!success)process.exitCode=1;finished=true;break;
  }
  await new Promise(r=>setTimeout(r,500));
 }
 if(!finished)throw Error('DEMO_TIMED_OUT');
}finally{server.close();}
