import {randomUUID} from 'node:crypto';
import {ResolutionContractSchema,ResolutionReceiptSchema,type ResolutionContract,type ResolutionReceipt,type ResolverManifest,type ResolverAttempt,type ResolveEvent} from './schemas';
import {plan,type Strategy} from './planner';
import {authorize} from './budget';
import {validate} from './validator';
import type {PaymentAdapter} from '../payments/types';
export type Emit=(type:ResolveEvent['type'],data:Record<string,unknown>)=>void;
export class ResolutionLadder {
 private used=new Set<string>();
 constructor(private payment:PaymentAdapter){}
 async resolve(input:ResolutionContract,manifests:ResolverManifest[],network:'sandbox'|'mainnet',emit:Emit,strategy:Strategy='RESOLVE'){
 const contract=ResolutionContractSchema.parse(input);if(this.used.has(contract.id))throw Error('DUPLICATE_CONTRACT');this.used.add(contract.id);
 const start=Date.now();let spent=0;const attempts:ResolverAttempt[]=[];let receipt:ResolutionReceipt|undefined;
 emit('CONTRACT_CREATED',{contractId:contract.id,budget:contract.budget,kind:contract.success.kind,requiredState:contract.requiredState});
 const ladder=plan(contract,manifests,spent,contract.deadlineMs,network,strategy);
 for(const resolver of ladder){
 const left=contract.deadlineMs-(Date.now()-start);const guard=authorize(resolver.quotedPriceUsd,spent,contract.budget.maxAttempt,contract.budget.maxTotal);
 if(!guard.allowed||left<resolver.expectedLatencyMs)continue;
 const attemptId=randomUUID();emit('RESOLVER_SELECTED',{resolverId:resolver.id,name:resolver.name,quotedPrice:resolver.quotedPriceUsd,prior:resolver.prior});
 let result;try {result=await this.payment.pay({attemptId,url:resolver.endpoint,method:'POST',body:{contract},maxAmountUsd:Math.min(contract.budget.maxAttempt,contract.budget.maxTotal-spent,resolver.quotedPriceUsd),signal:AbortSignal.timeout(Math.max(1,left)),onEvent:emit});}
 catch {attempts.push({id:attemptId,resolverId:resolver.id,status:'TIMEOUT',cost:0,reason:'PAYMENT_STATE_UNKNOWN'});emit('ABSTAINED',{reason:'PAYMENT_STATE_UNKNOWN',spent});return {attempts,spent};}
 if(result.status!=='SETTLED'||!result.transaction||result.amountUsd===undefined){attempts.push({id:attemptId,resolverId:resolver.id,status:'PAYMENT_FAIL',cost:0,reason:result.reason??'PAYMENT_FAILED'});if(result.uncertain){emit('ABSTAINED',{reason:'PAYMENT_STATE_UNKNOWN',spent});return {attempts,spent};}continue;}
 spent=Math.round((spent+result.amountUsd)*1e6)/1e6;
 emit('PAYMENT_SETTLED',{resolverId:resolver.id,amount:result.amountUsd,spent,transaction:result.transaction,network});
 if(Date.now()-start>contract.deadlineMs){attempts.push({id:attemptId,resolverId:resolver.id,status:'TIMEOUT',cost:result.amountUsd,reason:'DEADLINE',transaction:result.transaction});break;}
 if(!authorize(result.amountUsd,spent-result.amountUsd,contract.budget.maxAttempt,contract.budget.maxTotal).allowed){emit('ABSTAINED',{reason:'SETTLEMENT_EXCEEDS_CAP',spent});return {attempts,spent};}
 emit('RESULT_RECEIVED',{resolverId:resolver.id});
 const check=validate(contract,result.responseBody);
 const pass=check.pass&&result.responseStatus===200;
 attempts.push({id:attemptId,resolverId:resolver.id,status:pass?'PASS':check.malformed?'MALFORMED':'VALIDATION_FAIL',cost:result.amountUsd,reason:pass?'CONTRACT_SATISFIED':'CHECKS_FAILED',transaction:result.transaction});
 if(!pass){emit('VALIDATION_FAILED',{resolverId:resolver.id,checks:check.checks});const next=ladder.slice(ladder.indexOf(resolver)+1).some(r=>authorize(r.quotedPriceUsd,spent,contract.budget.maxAttempt,contract.budget.maxTotal).allowed&&r.expectedLatencyMs<=contract.deadlineMs-(Date.now()-start));if(next)emit('ESCALATING',{from:resolver.id});continue;}
 emit('VALIDATION_PASSED',{resolverId:resolver.id,checks:check.checks});
 receipt=ResolutionReceiptSchema.parse({id:randomUUID(),contractId:contract.id,resolverId:resolver.id,cost:result.amountUsd,paymentStatus:'SETTLED',verificationStatus:'PASS',result:result.responseBody,createdAt:new Date().toISOString(),transaction:result.transaction,network});
 emit('RECEIPT_ISSUED',{receipt});return {attempts,spent,receipt};
 }
 emit('ABSTAINED',{reason:ladder.length?'NO_VERIFIED_RESOLUTION':'NO_ELIGIBLE_RESOLVER',spent});return {attempts,spent};
 }
}
