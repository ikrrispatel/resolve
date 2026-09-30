import {randomUUID} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {ResolveEventSchema,type ResolveEvent} from './schemas';
export class EventStore {
 private tapes=new Map<string,ResolveEvent[]>();private bus=new EventEmitter();
 create(runId:string){if(this.tapes.size>=100)throw Error('RESET_REQUIRED');this.tapes.set(runId,[]);}
 emit(runId:string,type:ResolveEvent['type'],data:Record<string,unknown>){const tape=this.tapes.get(runId);if(!tape)throw Error('RUN_NOT_FOUND');const e=ResolveEventSchema.parse({id:randomUUID(),runId,sequence:tape.length,type,at:new Date().toISOString(),data});tape.push(e);this.bus.emit(runId,e);return e;}
 read(runId:string){return this.tapes.get(runId);}
 subscribe(runId:string,listener:(e:ResolveEvent)=>void){this.bus.on(runId,listener);return ()=>this.bus.off(runId,listener);}
 reset(){this.tapes.clear();}
}
