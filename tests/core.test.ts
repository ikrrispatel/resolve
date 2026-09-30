import {describe,it,expect,vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {ResolutionLadder} from '../packages/core/runtime';
import {scenario,policyManifest} from '../packages/core/scenarios';
import {policyResult} from '../packages/resolvers/policyVerifier';
import {ReceiptGate} from '../packages/agent-runtime/resume';
import {validate} from '../packages/core/validator';
import {authorize} from '../packages/core/budget';
import {plan} from '../packages/core/planner';
import type {ResolverManifest,ResolutionReceipt} from '../packages/core/schemas';
import type {PaymentResult} from '../packages/payments/types';
const manifest=policyManifest('http://localhost:4310');
const settled=(body:unknown):PaymentResult=>({status:'SETTLED',amountUsd:.001,transaction:'test-only-not-a-real-transaction-signature',responseStatus:200,responseBody:body});
describe('receipt and spending invariants (test doubles; no real payments)',()=>{
 it('denies overbudget without invoking the payment adapter',async()=>{const pay=vi.fn();const result=await new ResolutionLadder({pay}).resolve(scenario('abstain').contract,[manifest],'sandbox',()=>{});expect(pay).not.toHaveBeenCalled();expect(result.receipt).toBeUndefined();expect(result.spent).toBe(0);});
 it.each([NaN,Infinity,-1,.0000001])('denies invalid amounts %s',n=>expect(authorize(n,0,.05,.05).allowed).toBe(false));
 it('accounts exactly at microdollar boundary',()=>expect(authorize(.002,.001,.002,.003).allowed).toBe(true));
 it('cannot issue a receipt for an unpaid valid result',async()=>{const c=scenario('policy').contract;const events:string[]=[];const r=await new ResolutionLadder({pay:async()=>({status:'FAILED',responseBody:policyResult(c)})}).resolve(c,[manifest],'sandbox',t=>events.push(t));expect(r.receipt).toBeUndefined();expect(events).not.toContain('PAYMENT_SETTLED');expect(events).not.toContain('AGENT_RESUMED');});
 it('rejects a lying privacy flag and underpriced message',()=>{const c=scenario('policy').contract;expect(validate(c,{...policyResult(c),message:'Send your home address to 123 Private Lane'}).pass).toBe(false);expect(validate(c,{...policyResult(c),message:'I accept $850.'}).pass).toBe(false);});
 it('issued receipt is contract-bound and single-use',async()=>{const c=scenario('policy').contract;const ladder=new ResolutionLadder({pay:async()=>settled(policyResult(c))});const r=await ladder.resolve(c,[manifest],'sandbox',()=>{});expect(r.receipt).toBeDefined();const gate=new ReceiptGate();expect(()=>gate.consume({...c,id:randomUUID()},r.receipt)).toThrow();gate.consume(c,r.receipt);expect(()=>gate.consume(c,r.receipt)).toThrow();await expect(ladder.resolve(c,[manifest],'sandbox',()=>{})).rejects.toThrow('DUPLICATE_CONTRACT');});
 it('does not trust an unpaid or malformed receipt',()=>{expect(()=>new ReceiptGate().consume(scenario('policy').contract,{paymentStatus:'FAILED'})).toThrow();});
 it('unknown payment state stops escalation',async()=>{const pay=vi.fn(async()=>({status:'FAILED' as const,uncertain:true}));const r=await new ResolutionLadder({pay}).resolve(scenario('policy').contract,[manifest,{...manifest,id:'second'}],'sandbox',()=>{});expect(pay).toHaveBeenCalledTimes(1);expect(r.receipt).toBeUndefined();});
 it('keeps a partial-evidence provider eligible and escalates after independent failure',async()=>{const c=scenario('evidence').contract;const cheap:ResolverManifest={...manifest,id:'ocr',outputSchema:'evidence',capabilities:['text_evidence']};const premium={...cheap,id:'vision',quotedPriceUsd:.0015,capabilities:['text_evidence','logo_or_label_evidence','product_or_web_entity_evidence']};expect(plan(c,[cheap,premium],0,90000,'sandbox').map(x=>x.id)).toEqual(['ocr','vision']);let count=0;const events:string[]=[];const r=await new ResolutionLadder({pay:async()=>({...settled(++count===1?{provider:'test',textEvidence:['text']}:{provider:'test',textEvidence:['text'],logoOrLabelEvidence:['label'],productOrWebEntityEvidence:['entity']}),amountUsd:count===1?.001:.0015})}).resolve(c,[cheap,premium],'sandbox',t=>events.push(t));expect(r.attempts.map(a=>a.status)).toEqual(['VALIDATION_FAIL','PASS']);expect(r.spent).toBe(.0025);expect(events).toContain('ESCALATING');});
 it('counts settled but malformed results as spend',async()=>{const c=scenario('policy').contract;const r=await new ResolutionLadder({pay:async()=>settled(null)}).resolve(c,[manifest],'sandbox',()=>{});expect(r.attempts[0].status).toBe('MALFORMED');expect(r.spent).toBe(.001);expect(r.receipt).toBeUndefined();});
 it('excludes wrong network, incompatible schema and missed deadline',()=>{const c=scenario('policy').contract;expect(plan(c,[{...manifest,network:'mainnet'},{...manifest,outputSchema:'evidence'},{...manifest,expectedLatencyMs:100000}],0,1000,'sandbox')).toHaveLength(0);});
});

describe('unpaid benchmark claims',()=>{
 it('uses the same fixtures and never issues receipts',async()=>{const {runBenchmark}=await import('../packages/benchmark/run');const b=runBenchmark();expect(b.paymentExecuted).toBe(false);expect(b.receiptsIssued).toBe(0);expect(b.results.map(r=>r.cases.map(c=>c.id))).toEqual([b.results[0].cases.map(c=>c.id),b.results[0].cases.map(c=>c.id),b.results[0].cases.map(c=>c.id)]);expect(b.results.every(r=>r.resumes===0)).toBe(true);});
});
