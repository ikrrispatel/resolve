import {describe,it,expect} from 'vitest';
import {mkdtempSync,writeFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {SpendLedger} from '../packages/payments/spendLedger';
describe('authorization-wide cap',()=>{
 it('persists reservations across instances and retains unknown outcomes',()=>{const p=join(mkdtempSync(join(tmpdir(),'resolve-ledger-')),'spend');new SpendLedger(p).reserve('one',.3);const restarted=new SpendLedger(p);restarted.reserve('two',.2);expect(()=>restarted.reserve('three',.000001)).toThrow('TOTAL_SPEND_CAP');expect(()=>restarted.reserve('one',.1)).toThrow('DUPLICATE_ATTEMPT');});
 it('fails closed for corrupted state or an existing lock',()=>{const p=join(mkdtempSync(join(tmpdir(),'resolve-ledger-')),'spend');writeFileSync(p,'{}\n');expect(()=>new SpendLedger(p).reserve('one',.1)).toThrow();writeFileSync(p+'.lock','');expect(()=>new SpendLedger(p).reserve('two',.1)).toThrow();});
});
