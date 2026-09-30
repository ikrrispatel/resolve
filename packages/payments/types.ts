export interface PaymentInput {attemptId:string;url:string;method:string;headers?:Record<string,string>;body?:unknown;maxAmountUsd:number;signal?:AbortSignal;onEvent?:(event:'PAYMENT_REQUIRED'|'PAYMENT_AUTHORIZED',data:Record<string,unknown>)=>void}
export interface PaymentResult {status:'SETTLED'|'FAILED';amountUsd?:number;transaction?:string;responseStatus?:number;responseBody?:unknown;rawReceipt?:unknown;reason?:string;uncertain?:boolean}
export interface PaymentAdapter {pay(input:PaymentInput):Promise<PaymentResult>}
