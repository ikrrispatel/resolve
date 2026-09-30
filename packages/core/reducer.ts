import {ResolutionReceiptSchema,type ResolveEvent} from './schemas';
export type DemoState={stage:'RUNNING'|'PAUSED'|'RESOLVING'|'VERIFIED'|'RESUMED'|'ABSTAINED';events:ResolveEvent[];spent:number;checks:Record<string,boolean>;receipt?:Record<string,unknown>;message?:string;resolver?:string;reason?:string};
export const initialState:DemoState={stage:'RUNNING',events:[],spent:0,checks:{}};
export function reduceEvent(state:DemoState,event:ResolveEvent):DemoState {
 if(state.events.some(e=>e.id===event.id))return state;
 const next={...state,events:[...state.events,event]};
 if(event.type==='EXCEPTION_CREATED')next.stage='PAUSED';
 if(event.type==='RESOLVER_SELECTED'){next.stage='RESOLVING';next.resolver=String(event.data.name);}
 if(event.type==='PAYMENT_SETTLED')next.spent=Number(event.data.spent);
 if(event.type==='VALIDATION_FAILED'||event.type==='VALIDATION_PASSED')next.checks=event.data.checks as Record<string,boolean>;
 if(event.type==='RECEIPT_ISSUED'){
  const parsed=ResolutionReceiptSchema.safeParse(event.data.receipt);
  if(parsed.success){
   const receipt=parsed.data;
   const prior=state.events.filter(e=>e.runId===event.runId);
   const contract=[...prior].reverse().find(e=>e.type==='CONTRACT_CREATED');
   const validation=[...prior].reverse().find(e=>e.type==='VALIDATION_PASSED'||e.type==='VALIDATION_FAILED');
   const payment=[...prior].reverse().find(e=>e.type==='PAYMENT_SETTLED');
   if(contract?.data.contractId===receipt.contractId&&validation?.type==='VALIDATION_PASSED'&&validation.data.resolverId===receipt.resolverId&&payment?.data.resolverId===receipt.resolverId&&payment.data.transaction===receipt.transaction&&payment.data.network===receipt.network&&payment.data.amount===receipt.cost){next.stage='VERIFIED';next.receipt=receipt;}
  }
 }
 if(event.type==='AGENT_RESUMED'&&state.receipt&&event.data.receiptId===state.receipt.id&&state.events.some(e=>e.runId===event.runId&&e.type==='RECEIPT_ISSUED'&&(e.data.receipt as Record<string,unknown>)?.id===state.receipt?.id)){next.stage='RESUMED';next.message=String(event.data.message);}
 if(event.type==='ABSTAINED'){next.stage='ABSTAINED';next.reason=String(event.data.reason);}
 return next;
}
