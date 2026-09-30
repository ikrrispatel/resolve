import {closeSync,existsSync,mkdirSync,openSync,readFileSync,writeSync,fsyncSync,unlinkSync} from 'node:fs';
import {dirname} from 'node:path';
import {micro} from '../core/budget';
/** Append-only reservations survive crashes. Unknown outcomes retain their full cap. */
export class SpendLedger {
 constructor(private path:string){}
 reserve(attemptId:string,capUsd:number){
  const cap=micro(capUsd);if(cap<=0)throw Error('INVALID_SPEND_CAP');
  mkdirSync(dirname(this.path),{recursive:true});
  // Exclusive lock intentionally survives crashes; never silently recover an unknown payment.
  const lock=openSync(this.path+'.lock','wx',0o600);
  try{
   const rows=this.rows();if(rows.some(r=>r.attemptId===attemptId))throw Error('DUPLICATE_ATTEMPT');
   if(rows.reduce((n,r)=>n+r.reservedMicro,0)+cap>500000)throw Error('TOTAL_SPEND_CAP');
   const fd=openSync(this.path,'a',0o600);try{writeSync(fd,JSON.stringify({attemptId,reservedMicro:cap,at:new Date().toISOString()})+'\n');fsyncSync(fd);}finally{closeSync(fd);}
  }finally{closeSync(lock);unlinkSync(this.path+'.lock');}
 }
 rows():{attemptId:string;reservedMicro:number}[]{if(!existsSync(this.path))return [];return readFileSync(this.path,'utf8').trim().split('\n').filter(Boolean).map(s=>{const r=JSON.parse(s);if(typeof r.attemptId!=='string'||!Number.isSafeInteger(r.reservedMicro)||r.reservedMicro<=0)throw Error('INVALID_LEDGER');return r;});}
}
