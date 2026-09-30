import {it,expect} from 'vitest';
import {initialState,reduceEvent} from '../packages/core/reducer';
import type {ResolveEvent} from '../packages/core/schemas';
const event=(type:ResolveEvent['type'],sequence:number,data:Record<string,unknown>={}):ResolveEvent=>({id:String(sequence),runId:'test',sequence,type,at:new Date().toISOString(),data});
it('never stitches or resumes on an unverified event tape',()=>{let s=reduceEvent(initialState,event('RECEIPT_ISSUED',0,{receipt:{}}));expect(s.stage).toBe('RUNNING');s=reduceEvent(s,event('AGENT_RESUMED',1,{message:'unsafe'}));expect(s.stage).toBe('RUNNING');});
it('deduplicates reconnect replays and stitches after validation plus receipt',()=>{const e=event('VALIDATION_PASSED',0,{checks:{schema:true}});let s=reduceEvent(initialState,e);s=reduceEvent(s,e);expect(s.events).toHaveLength(1);s=reduceEvent(s,event('RECEIPT_ISSUED',1,{receipt:{id:'test'}}));expect(s.stage).toBe('VERIFIED');s=reduceEvent(s,event('AGENT_RESUMED',2,{message:'verified'}));expect(s.stage).toBe('RESUMED');});
