export const micro=(usd:number)=>{if(!Number.isFinite(usd)||usd<0||Math.abs(usd*1e6-Math.round(usd*1e6))>1e-6)throw Error('INVALID_AMOUNT');return Math.round(usd*1e6)};
export function authorize(amount:number,spent:number,maxAttempt:number,maxTotal:number){
 try {if(micro(amount)>micro(maxAttempt))return {allowed:false as const,reason:'MAX_ATTEMPT'};if(micro(amount)+micro(spent)>micro(maxTotal))return {allowed:false as const,reason:'MAX_TOTAL'};return {allowed:true as const};}catch{return {allowed:false as const,reason:'INVALID_AMOUNT'}}
}
