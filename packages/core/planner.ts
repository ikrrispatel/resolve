import type {ResolutionContract,ResolverManifest} from './schemas';
import {authorize} from './budget';
export type Strategy='CHEAPEST_ONLY'|'PREMIUM_ONLY'|'RESOLVE';
export function plan(contract:ResolutionContract,manifests:ResolverManifest[],spent:number,remainingMs:number,network:'sandbox'|'mainnet',strategy:Strategy='RESOLVE'){
 const dimensions=contract.success.kind==='policy'?['policy']:contract.success.requiredEvidence;
 const eligible=manifests.filter(r=>r.network===network&&r.outputSchema===contract.success.kind&&r.capabilities.some(c=>dimensions.includes(c as never))&&r.expectedLatencyMs<=remainingMs&&authorize(r.quotedPriceUsd,spent,contract.budget.maxAttempt,contract.budget.maxTotal).allowed);
 // Coarse capability-class priors are ranking heuristics, not measured success rates.
 eligible.sort((a,b)=>a.quotedPriceUsd/(a.prior==='high'?1:0.5)-b.quotedPriceUsd/(b.prior==='high'?1:0.5));
 if(strategy==='CHEAPEST_ONLY')return eligible.sort((a,b)=>a.quotedPriceUsd-b.quotedPriceUsd).slice(0,1);
 if(strategy==='PREMIUM_ONLY')return eligible.sort((a,b)=>b.quotedPriceUsd-a.quotedPriceUsd).slice(0,1);
 return eligible;
}
