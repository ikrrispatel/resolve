import {it,expect} from 'vitest';
import {verifyTransfer} from '../packages/payments/verifySettlement';
import {USDC} from '../packages/payments/sandbox';
const b=(owner:string,amount:string)=>({mint:USDC,owner,uiTokenAmount:{amount,decimals:6}});
const transaction={meta:{err:null,preTokenBalances:[b('payer','10000'),b('recipient','0')],postTokenBalances:[b('payer','9000'),b('recipient','1000')]}};
it('matches actual USDC transfer parties and amount',()=>{expect(verifyTransfer(transaction,'payer','recipient',1000n)).toBe(true);expect(verifyTransfer(transaction,'payer','attacker',1000n)).toBe(false);expect(verifyTransfer(transaction,'payer','recipient',1500n)).toBe(false);});
it('rejects malformed, errored and self-transfer transactions',()=>{expect(verifyTransfer(null,'payer','recipient',1000n)).toBe(false);expect(verifyTransfer({...transaction,meta:{...transaction.meta,err:{InstructionError:1}}},'payer','recipient',1000n)).toBe(false);expect(verifyTransfer(transaction,'payer','payer',1000n)).toBe(false);});
