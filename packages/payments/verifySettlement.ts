import {z} from 'zod';
import {USDC} from './sandbox';
const balance=z.object({mint:z.string(),owner:z.string(),uiTokenAmount:z.object({amount:z.string().regex(/^\d+$/),decimals:z.number()})});
const transaction=z.object({meta:z.object({err:z.null(),preTokenBalances:z.array(balance),postTokenBalances:z.array(balance)})});
export function verifyTransfer(raw:unknown,payer:string,recipient:string,amountAtomic:bigint){
 const parsed=transaction.safeParse(raw);if(!parsed.success||payer===recipient||amountAtomic<=0n)return false;
 const {preTokenBalances:pre,postTokenBalances:post}=parsed.data.meta;
 const total=(rows:z.infer<typeof balance>[],owner:string)=>rows.filter(b=>b.owner===owner&&b.mint===USDC&&b.uiTokenAmount.decimals===6).reduce((sum,b)=>sum+BigInt(b.uiTokenAmount.amount),0n);
 return total(pre,payer)-total(post,payer)===amountAtomic&&total(post,recipient)-total(pre,recipient)===amountAtomic;
}
