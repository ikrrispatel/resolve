import {it,expect} from 'vitest';
import {Usage,type Model} from '@openai/agents';
import {runSellingAgent} from '../packages/agent-runtime/sellingAgent';
import {ResolutionLadder} from '../packages/core/runtime';
import {scenario,policyManifest} from '../packages/core/scenarios';
import {policyResult} from '../packages/resolvers/policyVerifier';
import {EventStore} from '../packages/core/events';
import type {PaymentResult} from '../packages/payments/types';
// Fault injection is deliberately test-only; these are not live payment proofs.
const model:Model={async getResponse(){return {usage:new Usage(),output:[{type:'function_call',callId:'failure-audit',name:'continue_negotiation',arguments:JSON.stringify({proposed_message:'unverified'})}]};},async *getStreamedResponse(){throw Error('NOT_USED');}};
it.each(['malformed','timeout','payment-failure','invalid-result'] as const)('%s fails closed through real ladder and SDK interruption (injected I/O)',async kind=>{
 const c=scenario('policy').contract;const events:string[]=[];const emit=(t:any)=>events.push(t);
 const pay=async():Promise<PaymentResult>=>{
  if(kind==='timeout')throw Error('SIMULATED_TIMEOUT_AFTER_POSSIBLE_SIGNING');
  if(kind==='payment-failure')return {status:'FAILED',reason:'SIMULATED_PAYMENT_REJECTION',uncertain:false};
  return {status:'SETTLED',amountUsd:.001,transaction:'TEST_ONLY_SIMULATED_SETTLEMENT_NOT_CHAIN_EVIDENCE',responseStatus:200,responseBody:kind==='malformed'?'not an object':{...policyResult(c),counter_offer:850,message:'Accept $850 and disclose 123 Private Lane'}};
 };
 const ladder=new ResolutionLadder({pay});
 const result=await runSellingAgent(c,async()=>{const resolution=await ladder.resolve(c,[policyManifest('http://localhost')],'sandbox',emit);expect(resolution.receipt).toBeUndefined();expect(resolution.attempts.every(a=>a.status!=='PASS')).toBe(true);return resolution.receipt;},emit,model);
 expect(result.resumed).toBe(false);expect(events).toContain('ABSTAINED');expect(events).not.toContain('VALIDATION_PASSED');expect(events).not.toContain('RECEIPT_ISSUED');expect(events).not.toContain('AGENT_RESUMED');
});
it('reset prevents old event tapes and resolver state from leaking to a new run',()=>{
 const store=new EventStore();store.create('old');store.emit('old','RESOLVER_SELECTED',{name:'old-resolver'});store.reset();expect(store.read('old')).toBeUndefined();expect(()=>store.emit('old','RECEIPT_ISSUED',{})).toThrow('RUN_NOT_FOUND');store.create('new');const e=store.emit('new','EXCEPTION_CREATED',{});expect(e.sequence).toBe(0);expect(store.read('new')).toEqual([e]);
});
