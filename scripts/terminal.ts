import {initialState,reduceEvent} from '../packages/core/reducer';
import type {ResolveEvent,ResolverManifest} from '../packages/core/schemas';

const WIDTH=64,ARM='─'.repeat(25);
const colors={muted:90,blocked:91,active:36,verified:32,plain:37};
type Tone=keyof typeof colors;
export const usd=(n:number)=>`$${n.toFixed(6).replace(/0+$/,'').replace(/\.$/,'')}`;
// Output is a presentation of reviewed events, never a credential/debug dump.
export function safeText(value:unknown){return String(value)
 .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g,'').replace(/[\x00-\x1f\x7f]/g,' ')
 .replace(/sk-[A-Za-z0-9_-]{16,}/g,'[redacted]')
 .replace(/Bearer\s+\S+/gi,'Bearer [redacted]')
 .replace(/\/(?:Users|home)\/[^\s"']+/g,'[local path]');}
export function terminal(write:(line:string)=>void=console.log,color=!!process.stdout.isTTY&&!('NO_COLOR' in process.env)){
 const wrap=(text:string,width:number)=>{const chunks:string[]=[];while(text.length>width){const space=text.lastIndexOf(' ',width);const end=space>0?space:width;chunks.push(text.slice(0,end));text=text.slice(end).trimStart();}chunks.push(text);return chunks;};
 const line=(value='',tone:Tone='plain')=>{for(const chunk of wrap(safeText(value),WIDTH))write(color?`\x1b[${colors[tone]}m${chunk}\x1b[0m`:chunk);};
 const row=(label:string,value:unknown,tone:Tone='plain')=>{wrap(safeText(value),WIDTH-31).forEach((chunk,i)=>line(`${(i?'':label).padEnd(30)} ${chunk}`,tone));};
 const section=(name:string,tone:Tone='plain')=>{line();line(name,tone);line('─'.repeat(WIDTH),'muted');};
 const path=(node:'▶'|'╳'|'●',tone:Tone)=>{line();line(node==='▶'?'─'.repeat(WIDTH-1)+'▶':`${ARM}${node}${'─'.repeat(WIDTH-26)}`,tone);};
 return {line,row,section,path};
}
export function demoRenderer(options:{agent:boolean;manifests:ResolverManifest[];write?:(line:string)=>void;color?:boolean;verbose?:boolean}){
 const t=terminal(options.write,options.color);let state=initialState,attempt=0;
 t.line('resolve');t.line(`exception runtime / ${options.agent?'live agent':'core only'} / sandbox`,'muted');
 t.line('Deterministic provider payloads. No mainnet settlement.','muted');
 if(!options.agent)t.line('Agent not connected. Use --agent for live pause / resume.','muted');
 t.path('▶','muted');
 return (event:ResolveEvent)=>{
  if(state.events.some(e=>e.id===event.id))return;
  state=reduceEvent(state,event);const d=event.data;
  if(options.verbose)t.line(`${event.type} ${JSON.stringify(d)}`,'muted');
  switch(event.type){
   case 'EXCEPTION_CREATED':t.row('task',d.task);t.path('╳','blocked');t.line('                         │','blocked');t.line(`                         ▼ ${d.type}`,'blocked');break;
   case 'CONTRACT_CREATED':{
    t.section('resolution contract');const required=d.requiredState as Record<string,unknown>;
    if(d.kind==='policy'){t.row('price floor',`>= ${usd(Number(required.minimumPrice))}`);t.row('home address',required.homeAddressDisclosed===false?'private':'unspecified');t.row('conversation',required.conversationCanContinue===true?'actionable':'unspecified');}
    else {for(const [key,value] of Object.entries(required))t.row(key,value===true?'required':String(value));t.line('Evidence presence only; authenticity is not established.','muted');}
    const budget=d.budget as {maxTotal:number};t.row('max resolution spend',usd(budget.maxTotal));
    t.section('resolution ladder','active');for(const m of options.manifests)t.row(m.name,usd(m.quotedPriceUsd),'muted');break;
   }
   case 'RESOLVER_SELECTED':t.section(`resolver ${String(++attempt).padStart(2,'0')} / ${d.name}`,'active');t.row('selected quote',usd(Number(d.quotedPrice)),'active');break;
   case 'PAYMENT_REQUIRED':t.section('payment','active');t.row('challenge','402','active');t.row('requested',usd(Number(d.amount)),'active');break;
   case 'PAYMENT_AUTHORIZED':t.row('authorization','allowed · signing / retry','active');break;
   case 'PAYMENT_SETTLED':t.line('PAYMENT SETTLED','active');t.row('rail',`x402 / Solana ${d.network}`,'active');t.row('amount',usd(Number(d.amount)),'active');t.row('total spent',usd(Number(d.spent)));t.line('transaction','muted');t.line(String(d.transaction),'muted');break;
   case 'RESULT_RECEIVED':t.row('payload','deterministic provider evidence','muted');break;
   case 'VALIDATION_FAILED':case 'VALIDATION_PASSED':{
    const pass=event.type==='VALIDATION_PASSED';t.section('independent SuccessContract validation',pass?'verified':'blocked');
    const labels:Record<string,string>={counter_offer:'price floor',home_address_disclosed:'address private',conversation_can_continue:'actionable',text_evidence:'text evidence',logo_or_label_evidence:'label evidence',product_or_web_entity_evidence:'web evidence'};
    for(const [key,value] of Object.entries(d.checks as Record<string,boolean>))t.row(labels[key]??key,value?'✓':'✕',value?'verified':'blocked');
    t.line(pass?'VALIDATION PASS':'VALIDATION FAILED',pass?'verified':'blocked');
    if(!pass){t.row('branch','FAILED','blocked');t.line('                         └────────╳','blocked');}break;
   }
   case 'ESCALATING':t.section('ESCALATING','active');t.line('                         └────────▶ next resolver','active');break;
   case 'RECEIPT_ISSUED':{
    if(!state.receipt){t.row('receipt','REJECTED','blocked');break;}
    t.section('ResolutionReceipt','verified');t.row('verification','PASS','verified');t.row('paid',usd(Number(state.receipt.cost)),'verified');t.row('network',state.receipt.network,'muted');t.line('receipt','muted');t.line(String(state.receipt.id),'muted');t.line('RESOLUTION VERIFIED','verified');t.path('●','verified');
    if(!options.agent)t.row('resume','not executed · core-only run','muted');break;
   }
   case 'AGENT_RESUMED':if(state.stage==='RESUMED'){t.section('AGENT RESUMED','verified');t.line(String(state.message));}else t.row('resume','BLOCKED · no matching valid receipt','blocked');break;
   case 'ABSTAINED':t.section('ABSTAIN','blocked');t.row('reason',d.reason,'blocked');t.row('spent',d.spent===undefined?'unknown':usd(Number(d.spent)));t.row('receipt','none');t.row('resume','blocked','blocked');t.path('╳','blocked');break;
  }
 };
}
export function benchmarkSummary(result:{results:Array<{strategy:string;fixtureCount:number;validationRate:number;quotedCostPerValidatedResolution:number|null;quotedSpend:number;escalations:number}>},write:(line:string)=>void=console.log){
 const t=terminal(write);t.line('resolve');t.line('benchmark / validation only','muted');t.line(`${result.results[0]?.fixtureCount??0} deterministic fixtures`);t.section('strategy comparison');
 const row=(name:string,values:string[])=>t.line(name.padEnd(22)+values.map(v=>v.padStart(13)).join(''));
 row('',result.results.map(r=>r.strategy.replace('_ONLY','').toLowerCase()));
 row('validator success',result.results.map(r=>(r.validationRate*100).toFixed(1)+'%'));
 row('cost / verified*',result.results.map(r=>r.quotedCostPerValidatedResolution===null?'—':usd(Number(r.quotedCostPerValidatedResolution.toFixed(4)))));
 row('total spend*',result.results.map(r=>`$${r.quotedSpend.toFixed(4)}`));row('escalations',result.results.map(r=>String(r.escalations)));
 t.line();t.line('* Hypothetical resolver quotes; no payments executed.','muted');t.line('No receipts or agent resumes. Not authenticity detection.','muted');
}
