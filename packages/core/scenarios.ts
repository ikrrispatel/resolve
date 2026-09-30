import {randomUUID} from 'node:crypto';
import type {AgentException,ResolutionContract,ResolverManifest} from './schemas';
export function scenario(kind:'policy'|'evidence'|'abstain',minimumPrice=900,maxTotal=0.05){
 const exception:AgentException={id:randomUUID(),type:kind==='evidence'?'EVIDENCE_GAP':'POLICY_CONFLICT',task:kind==='evidence'?'Acquire image evidence before purchase':'Sell my MacBook',context:{buyerOffer:850},maxResolutionSpend:kind==='abstain'?0.0001:maxTotal,deadlineMs:90000,createdAt:new Date().toISOString()};
 const contract:ResolutionContract={id:randomUUID(),exceptionId:exception.id,requiredState:kind==='evidence'?{text_evidence:true,logo_or_label_evidence:true,product_or_web_entity_evidence:true}:{minimumPrice,homeAddressDisclosed:false,conversationCanContinue:true},budget:{maxTotal:exception.maxResolutionSpend,maxAttempt:exception.maxResolutionSpend},deadlineMs:90000,success:kind==='evidence'?{kind:'evidence',requiredEvidence:['text_evidence','logo_or_label_evidence','product_or_web_entity_evidence']}:{kind:'policy',minimumPrice,privateAddress:'123 Private Lane'}};
 return {exception,contract};
}
export const policyManifest=(origin:string):ResolverManifest=>({id:'policy-verifier',name:'Policy Verifier',source:'LOCAL',class:'VERIFIER',capabilities:['policy'],quotedPriceUsd:0.001,endpoint:origin+'/paid/policy',expectedLatencyMs:3000,outputSchema:'policy',network:'sandbox',prior:'high'});
