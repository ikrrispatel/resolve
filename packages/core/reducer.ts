import type {ResolveEvent} from './schemas';
export type DemoState={stage:'RUNNING'|'PAUSED'|'RESOLVING'|'VERIFIED'|'RESUMED'|'ABSTAINED';events:ResolveEvent[];spent:number;checks:Record<string,boolean>;receipt?:Record<string,unknown>;message?:string;resolver?:string;reason?:string};
export const initialState:DemoState={stage:'RUNNING',events:[],spent:0,checks:{}};
export function reduceEvent(state:DemoState,event:ResolveEvent):DemoState {
 if(state.events.some(e=>e.id===event.id))return state;
 const next={...state,events:[...state.events,event]};
 if(event.type==='EXCEPTION_CREATED')next.stage='PAUSED';
 if(event.type==='RESOLVER_SELECTED'){next.stage='RESOLVING';next.resolver=String(event.data.name);}
 if(event.type==='PAYMENT_SETTLED')next.spent=Number(event.data.spent);
 if(event.type==='VALIDATION_FAILED'||event.type==='VALIDATION_PASSED')next.checks=event.data.checks as Record<string,boolean>;
 if(event.type==='RECEIPT_ISSUED'&&state.events.some(e=>e.type==='VALIDATION_PASSED')){next.stage='VERIFIED';next.receipt=event.data.receipt as Record<string,unknown>;}
 if(event.type==='AGENT_RESUMED'&&state.receipt){next.stage='RESUMED';next.message=String(event.data.message);}
 if(event.type==='ABSTAINED'){next.stage='ABSTAINED';next.reason=String(event.data.reason);}
 return next;
}
