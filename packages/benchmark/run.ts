import {performance} from 'node:perf_hooks';
import {scenario,policyManifest} from '../core/scenarios';
import {plan,type Strategy} from '../core/planner';
import {validate} from '../core/validator';
import {authorize} from '../core/budget';
import {policyResult} from '../resolvers/policyVerifier';
import type {ResolutionContract,ResolverManifest} from '../core/schemas';
export function runBenchmark(){
 const fixtures:Array<{id:string;contract:ResolutionContract;kind:string}>=[];
 for(let i=0;i<40;i++){const kind=['policy','text','rich','budget'][i%4];const c=scenario(kind==='policy'?'policy':kind==='budget'?'abstain':'evidence',900+i).contract;if(kind==='text'&&c.success.kind==='evidence')c.success.requiredEvidence=['text_evidence'];fixtures.push({id:`synthetic-${i}`,contract:c,kind});}
 for(const kind of ['malformed','timeout','provider-failure','missing-evidence'])fixtures.push({id:`synthetic-${kind}`,contract:scenario('evidence').contract,kind});
 const strategies:Strategy[]=['CHEAPEST_ONLY','PREMIUM_ONLY','RESOLVE'];
 const results=strategies.map(strategy=>{let spend=0,verified=0,failures=0,escalations=0,abstentions=0;const mix:Record<string,number>={};const start=performance.now();const cases=fixtures.map(f=>{
 const base=policyManifest('http://benchmark.invalid');const manifests:ResolverManifest[]=f.contract.success.kind==='policy'?[{...base,id:'cheap-policy'},{...base,id:'premium-policy',quotedPriceUsd:.004}]:[{...base,id:'ocr',outputSchema:'evidence',capabilities:['text_evidence']},{...base,id:'vision',outputSchema:'evidence',capabilities:['text_evidence','logo_or_label_evidence','product_or_web_entity_evidence'],quotedPriceUsd:.0015}];
 const ladder=plan(f.contract,manifests,0,90000,'sandbox',strategy);let cost=0,pass=false,attempts=0;
 for(const m of ladder){if(!authorize(m.quotedPriceUsd,cost,f.contract.budget.maxAttempt,f.contract.budget.maxTotal).allowed)continue;if(attempts++)escalations++;mix[m.id]=(mix[m.id]??0)+1;
 // Hypothetical quotes only. No payment adapter, settlement, receipt or resume.
 cost+=m.quotedPriceUsd;
 let payload:unknown=f.contract.success.kind==='policy'?policyResult(f.contract):m.id==='ocr'?{provider:'synthetic',textEvidence:['Example label']}:{provider:'synthetic',textEvidence:['Example label'],logoOrLabelEvidence:['Example logo'],productOrWebEntityEvidence:['Example entity']};
 if(['malformed','timeout','provider-failure'].includes(f.kind))payload=null;if(f.kind==='missing-evidence')payload={provider:'synthetic',textEvidence:['Example label']};
 pass=validate(f.contract,payload).pass;if(pass)break;failures++;
 }
 cost=Math.round(cost*1e6)/1e6;spend+=cost;if(pass)verified++;else abstentions++;return {id:f.id,kind:f.kind,validated:pass,quotedCost:cost,attempts};
 });return {strategy,fixtureCount:fixtures.length,validated:verified,validationRate:verified/fixtures.length,quotedSpend:Math.round(spend*1e6)/1e6,quotedCostPerValidatedResolution:verified?spend/verified:null,validationFailures:failures,escalations,abstentions,resolverMix:mix,unverifiedResumes:0,resumes:0,evaluationLatencyMs:performance.now()-start,cases};});
 return {mode:'SYNTHETIC_VALIDATION_ONLY',paymentExecuted:false,receiptsIssued:0,claims:'Measured validator outcomes on shared synthetic fixtures; costs are hypothetical catalog/local quotes. No settlement or agent-resume proof.',createdAt:new Date().toISOString(),results};
}
