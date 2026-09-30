import {it,expect} from 'vitest';
import {initialState,reduceEvent} from '../packages/core/reducer';
import type {ResolveEvent} from '../packages/core/schemas';
const event=(type:ResolveEvent['type'],sequence:number,data:Record<string,unknown>={}):ResolveEvent=>({id:String(sequence),runId:'test',sequence,type,at:new Date().toISOString(),data});
// Test-only payment evidence; no network or real settlement in this unit test.
const receipt={id:'receipt',contractId:'contract',resolverId:'resolver',cost:.001,paymentStatus:'SETTLED',verificationStatus:'PASS',result:{},createdAt:new Date().toISOString(),transaction:'TEST_DOUBLE_NOT_AN_ACTUAL_PAYMENT',network:'sandbox'};
const validated=()=>[
 event('CONTRACT_CREATED',0,{contractId:'contract'}),
 event('PAYMENT_SETTLED',1,{resolverId:'resolver',amount:.001,spent:.001,transaction:receipt.transaction,network:'sandbox'}),
 event('VALIDATION_PASSED',2,{resolverId:'resolver',checks:{schema:true}}),
].reduce(reduceEvent,initialState);
it('never stitches or resumes on an unverified event tape',()=>{let s=reduceEvent(initialState,event('RECEIPT_ISSUED',0,{receipt:{}}));expect(s.stage).toBe('RUNNING');s=reduceEvent(s,event('AGENT_RESUMED',1,{message:'unsafe'}));expect(s.stage).toBe('RUNNING');});
it('deduplicates reconnect replays and stitches after matching payment, validation and receipt',()=>{let s=validated();s=reduceEvent(s,s.events[2]);expect(s.events).toHaveLength(3);s=reduceEvent(s,event('RECEIPT_ISSUED',3,{receipt}));expect(s.stage).toBe('VERIFIED');s=reduceEvent(s,event('AGENT_RESUMED',4,{receiptId:receipt.id,message:'verified'}));expect(s.stage).toBe('RESUMED');});
it('rejects a malformed receipt even after a validation event',()=>{let s=validated();s=reduceEvent(s,event('RECEIPT_ISSUED',3,{receipt:{id:'forged'}}));s=reduceEvent(s,event('AGENT_RESUMED',4,{receiptId:'forged',message:'unsafe'}));expect(s.receipt).toBeUndefined();expect(s.stage).not.toBe('RESUMED');});
it.each([{contractId:'wrong'},{transaction:'FORGED_TRANSACTION_NOT_ACTUAL_PAYMENT'},{resolverId:'wrong'},{cost:.002},{network:'mainnet'},{verificationStatus:'FAIL'}])('rejects a receipt inconsistent with observed evidence: %j',patch=>{const s=reduceEvent(validated(),event('RECEIPT_ISSUED',3,{receipt:{...receipt,...patch}}));expect(s.receipt).toBeUndefined();});
it('does not resume with a different receipt or run',()=>{const s=reduceEvent(validated(),event('RECEIPT_ISSUED',3,{receipt}));expect(reduceEvent(s,event('AGENT_RESUMED',4,{receiptId:'other'})).stage).toBe('VERIFIED');expect(reduceEvent(s,{...event('AGENT_RESUMED',4,{receiptId:receipt.id}),runId:'other'}).stage).toBe('VERIFIED');});
it('does not stitch after the latest validation failed',()=>{let s=reduceEvent(validated(),event('VALIDATION_FAILED',3,{resolverId:'resolver',checks:{schema:false}}));s=reduceEvent(s,event('RECEIPT_ISSUED',4,{receipt}));expect(s.receipt).toBeUndefined();});
