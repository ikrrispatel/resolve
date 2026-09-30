import {verifyTransfer} from './verifySettlement';
import type {KeyPairSigner} from '@solana/kit';
import {x402Client,wrapFetchWithPayment} from '@x402/fetch';
import {ExactSvmScheme} from '@x402/svm/exact/client';
import {decodePaymentResponseHeader} from '@x402/core/http';
import {SVM_NETWORK,USDC,rpc} from './sandbox';
import {micro} from '../core/budget';
import type {PaymentAdapter,PaymentInput,PaymentResult} from './types';
export class X402FoundationAdapter implements PaymentAdapter {
 private attempts=new Set<string>();private transactions=new Set<string>();
 constructor(private signer:KeyPairSigner,private rpcUrl:string,private origins:Set<string>){}
 async pay(input:PaymentInput):Promise<PaymentResult>{
 if(this.attempts.has(input.attemptId))return {status:'FAILED',reason:'DUPLICATE_ATTEMPT'};this.attempts.add(input.attemptId);
 if(!this.origins.has(new URL(input.url).origin))return {status:'FAILED',reason:'ORIGIN_DENIED'};
 let signed=false,selectedAmount:number|undefined,recipient:string|undefined;let payments=0;
 try{
 const cap=micro(input.maxAmountUsd);
 const client=new x402Client().register(SVM_NETWORK,new ExactSvmScheme(this.signer,{rpcUrl:this.rpcUrl}));
 client.registerPolicy((_v,requirements)=>requirements.filter(r=>r.scheme==='exact'&&r.network===SVM_NETWORK&&r.asset===USDC&&/^\d+$/.test(r.amount)&&BigInt(r.amount)<=BigInt(cap)));
 client.onBeforePaymentCreation(async({selectedRequirements:r})=>{if(payments++>0)return {abort:true,reason:'ONE_PAYMENT_PER_ATTEMPT'};selectedAmount=Number(r.amount)/1e6;recipient=r.payTo;input.onEvent?.('PAYMENT_REQUIRED',{amount:selectedAmount});input.onEvent?.('PAYMENT_AUTHORIZED',{amount:selectedAmount,reason:'BUDGET_GUARD'});});
 client.onAfterPaymentCreation(async()=>{signed=true;});
 const paid=wrapFetchWithPayment(fetch,client);
 const response=await paid(input.url,{method:input.method,headers:{'content-type':'application/json',...input.headers},body:input.body===undefined?undefined:JSON.stringify(input.body),signal:input.signal,redirect:'error'});
 const header=response.headers.get('payment-response');
 if(!header||selectedAmount===undefined)return {status:'FAILED',reason:'MISSING_SETTLEMENT',uncertain:signed};
 const receipt=decodePaymentResponseHeader(header);
 if(!receipt.success||!receipt.transaction||receipt.network!==SVM_NETWORK||receipt.payer!==this.signer.address||this.transactions.has(receipt.transaction))return {status:'FAILED',reason:'UNCONFIRMED_SETTLEMENT',uncertain:signed};
 const chain=await rpc(this.rpcUrl,'getSignatureStatuses',[[receipt.transaction],{searchTransactionHistory:true}]);
 if(!chain?.value?.[0]||chain.value[0].err!==null)return {status:'FAILED',reason:'CHAIN_CONFIRMATION_MISSING',uncertain:true};
 const transfer=await rpc(this.rpcUrl,'getTransaction',[receipt.transaction,{encoding:'jsonParsed',maxSupportedTransactionVersion:0}]);
 if(!recipient||!verifyTransfer(transfer,this.signer.address,recipient,BigInt(micro(selectedAmount))))return {status:'FAILED',reason:'TRANSFER_MISMATCH',uncertain:true};
 this.transactions.add(receipt.transaction);
 let body:unknown;try{body=await response.json()}catch{body=null;}
 return {status:'SETTLED',amountUsd:selectedAmount,transaction:receipt.transaction,responseStatus:response.status,responseBody:body,rawReceipt:receipt};
 }catch{return {status:'FAILED',reason:input.signal?.aborted?'TIMEOUT':'PAYMENT_FAILED',uncertain:signed};}
 }
}
