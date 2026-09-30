import {x402Facilitator} from '@x402/core/facilitator';
import {toFacilitatorSvmSigner} from '@x402/svm';
import {ExactSvmScheme as FacilitatorScheme} from '@x402/svm/exact/facilitator';
import {ExactSvmScheme as ServerScheme} from '@x402/svm/exact/server';
import {paymentMiddleware,x402ResourceServer} from '@x402/express';
import {SANDBOX_RPC,SVM_NETWORK,sandboxSigner} from './sandbox';
export async function sandboxGate(){
 const merchant=await sandboxSigner();const facilitator=new x402Facilitator().register(SVM_NETWORK,new FacilitatorScheme(toFacilitatorSvmSigner(merchant,{defaultRpcUrl:SANDBOX_RPC})));
 const resource=new x402ResourceServer({getSupported:async()=>{const supported=facilitator.getSupported();return {...supported,kinds:supported.kinds.map(k=>({...k,network:SVM_NETWORK}))};},verify:(p,r)=>facilitator.verify(p,r),settle:(p,r)=>facilitator.settle(p,r)}).register(SVM_NETWORK,new ServerScheme());
 const route=(price:string,description:string)=>({accepts:{scheme:'exact',network:SVM_NETWORK,payTo:merchant.address,price},description,mimeType:'application/json'});
 return paymentMiddleware({'POST /paid/evidence/text':route('$0.001','Synthetic text evidence fixture — sandbox only'),'POST /paid/evidence/rich':route('$0.0015','Synthetic rich evidence fixture — sandbox only'),'POST /paid/policy':{accepts:{scheme:'exact',network:SVM_NETWORK,payTo:merchant.address,price:'$0.001'},description:'Deterministic policy resolution',mimeType:'application/json'}},resource);
}
