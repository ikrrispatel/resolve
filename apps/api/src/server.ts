import {evidenceFixture,evidenceManifests} from '../../../packages/resolvers/evidenceFixtures';
import {existsSync} from 'node:fs';
import {runSellingAgent} from '../../../packages/agent-runtime/sellingAgent';
import {runBenchmark} from '../../../packages/benchmark/run';
if(existsSync('.env'))process.loadEnvFile('.env');
import express from 'express';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {sandboxGate} from '../../../packages/payments/gate';
import {SANDBOX_RPC,sandboxSigner} from '../../../packages/payments/sandbox';
import {X402FoundationAdapter} from '../../../packages/payments/x402Adapter';
import {ResolutionLadder} from '../../../packages/core/runtime';
import {EventStore} from '../../../packages/core/events';
import {scenario,policyManifest} from '../../../packages/core/scenarios';
import {ResolutionContractSchema} from '../../../packages/core/schemas';
import {PolicyVerifierResolver} from '../../../packages/resolvers/policyVerifier';
import {pathToFileURL} from 'node:url';
export async function createServer(port=4310){
 const origin=`http://127.0.0.1:${port}`;const app=express();app.use(express.json({limit:'100kb'}));
 const events=new EventStore();let active=false;
 app.use((req,res,next)=>{if(req.headers.origin&&!['http://localhost:3000','http://127.0.0.1:3000'].includes(req.headers.origin)){res.status(403).json({error:'ORIGIN_DENIED'});return;}next();});
 const policyResolver=new PolicyVerifierResolver(origin);const payer=await sandboxSigner();app.use(await sandboxGate());
 app.post('/paid/policy',async(req,res)=>{const parsed=ResolutionContractSchema.safeParse(req.body.contract);if(!parsed.success||parsed.data.success.kind!=='policy'){res.status(400).json({error:'INVALID_CONTRACT'});return;}res.json(await policyResolver.resolve(parsed.data));});
 app.post('/paid/evidence/:kind',(req,res)=>{const c=ResolutionContractSchema.safeParse(req.body.contract);if(!c.success||c.data.success.kind!=='evidence'||!['text','rich'].includes(req.params.kind)){res.status(400).json({error:'INVALID_CONTRACT'});return;}res.json(evidenceFixture(req.params.kind==='rich'));});
 const payment=new X402FoundationAdapter(payer,SANDBOX_RPC,new Set([origin]));const ladder=new ResolutionLadder(payment);
 app.get('/api/health',(_q,r)=>r.json({ok:true,network:'sandbox',payment:'x402 Foundation SVM',agentReady:!!process.env.OPENAI_API_KEY,catalogReady:false}));
 app.get('/api/benchmark',(_q,r)=>r.json(runBenchmark()));
 app.post('/api/runs',(req,res)=>{const parsed=z.object({scenario:z.enum(['policy','abstain','evidence']),agent:z.boolean().default(false),minimumPrice:z.number().min(1).max(100000).default(900),maxTotal:z.number().min(0).max(.05).default(.05)}).safeParse(req.body);if(!parsed.success){res.status(400).json({error:'INVALID_REQUEST'});return;}if(active){res.status(409).json({error:'RUN_IN_PROGRESS'});return;}if(parsed.data.agent&&!process.env.OPENAI_API_KEY){res.status(412).json({error:'OPENAI_API_KEY_REQUIRED'});return;}active=true;const runId=randomUUID();events.create(runId);const {exception,contract}=scenario(parsed.data.scenario,parsed.data.minimumPrice,parsed.data.maxTotal);if(!parsed.data.agent)events.emit(runId,'EXCEPTION_CREATED',{exceptionId:exception.id,type:exception.type,task:exception.task,mode:parsed.data.scenario==='evidence'?'SANDBOX_FIXTURE_ESCALATION':'SANDBOX_POLICY',agentRuntime:parsed.data.agent?'OpenAI Agents JS':'Not connected'});res.status(202).json({runId});const emit=(t:Parameters<typeof events.emit>[1],d:Record<string,unknown>)=>{events.emit(runId,t,d);};const resolve=()=>ladder.resolve(contract,parsed.data.scenario==='evidence'?evidenceManifests(origin):[policyManifest(origin)],'sandbox',emit);void (parsed.data.agent?runSellingAgent(contract,async()=>(await resolve()).receipt,emit):resolve()).catch(()=>events.emit(runId,'ABSTAINED',{reason:'INTERNAL_FAILURE'})).finally(()=>{active=false;});});
 app.get('/api/runs/:id/events',(req,res)=>{const tape=events.read(req.params.id);if(!tape){res.status(404).end();return;}res.set({'content-type':'text/event-stream','cache-control':'no-cache, no-transform','x-accel-buffering':'no','connection':'keep-alive'});res.flushHeaders();const last=Number(req.headers['last-event-id']??-1);for(const event of tape)if(event.sequence>last)res.write(`id: ${event.sequence}\ndata: ${JSON.stringify(event)}\n\n`);const unsubscribe=events.subscribe(req.params.id,e=>res.write(`id: ${e.sequence}\ndata: ${JSON.stringify(e)}\n\n`));const ping=setInterval(()=>res.write(': keepalive\n\n'),15000);req.on('close',()=>{clearInterval(ping);unsubscribe();});});
 app.get('/api/runs/:id', (req,res)=>{const tape=events.read(req.params.id);if(!tape){res.status(404).json({error:'NOT_FOUND'});return;}res.json(tape);});
 app.post('/api/reset',(_q,r)=>{if(active){r.status(409).json({error:'RUN_IN_PROGRESS'});return;}events.reset();r.json({ok:true});});
 const server=app.listen(port,'127.0.0.1');await new Promise<void>((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject)});return {server,origin,events};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){createServer(Number(process.env.PORT??4310)).then(({origin})=>console.log(`Resolve API: ${origin} (SANDBOX)`)).catch(()=>{console.error('API_START_FAILED');process.exitCode=1;});}
