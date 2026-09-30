'use client';
import {useEffect,useReducer,useRef,useState} from 'react';
import {initialState,reduceEvent} from '../../../../packages/core/reducer';
import {ResolveEventSchema,type ResolveEvent} from '../../../../packages/core/schemas';
type Kind='policy'|'evidence'|'abstain';
const flowNames:Record<Kind,string>={policy:'Policy pass',evidence:'Escalation',abstain:'Abstention'};
export default function Demo(){
 const [kind,setKind]=useState<Kind>('policy');
 const [state,dispatch]=useReducer((s:typeof initialState,e:ResolveEvent|null)=>e?reduceEvent(s,e):initialState,initialState);
 const [runId,setRunId]=useState(''),[minimum,setMinimum]=useState(900),[budget,setBudget]=useState(.05);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[ready,setReady]=useState(false),[agent,setAgent]=useState(false),[replay,setReplay]=useState(false);
 const source=useRef<EventSource|null>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null),tape=useRef<ResolveEvent[]>([]);
 useEffect(()=>{fetch('/api/health').then(r=>r.json()).then(h=>{setReady(h.agentReady);setAgent(h.agentReady);}).catch(()=>setError('Resolution service unavailable. No execution started.'));return ()=>{source.current?.close();if(timer.current)clearInterval(timer.current);};},[]);
 const start=async()=>{
  setError('');setBusy(true);setReplay(false);dispatch(null);tape.current=[];source.current?.close();
  try{
   const r=await fetch('/api/runs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenario:kind,minimumPrice:minimum,maxTotal:budget,agent})});const b=await r.json();if(!r.ok)throw Error(b.error);setRunId(b.runId);
   const feed=new EventSource(`/api/runs/${b.runId}/events`);source.current=feed;
   feed.onmessage=e=>{try{const event=ResolveEventSchema.parse(JSON.parse(e.data));if(tape.current.some(x=>x.id===event.id))return;tape.current.push(event);dispatch(event);if(event.type==='AGENT_RESUMED'||event.type==='ABSTAINED'||(!agent&&event.type==='RECEIPT_ISSUED')){setBusy(false);feed.close();}}catch{setError('Invalid event. Display stopped; no success inferred.');setBusy(false);feed.close();}};
   feed.onerror=()=>{setError('Event connection interrupted. No success inferred. Reset before another run.');setBusy(false);feed.close();};
  }catch(e){setError(e instanceof Error?e.message:'Unable to start');setBusy(false);}
 };
 const reset=async()=>{setError('');try{const r=await fetch('/api/reset',{method:'POST'});if(!r.ok)throw Error('A run is still active. Wait for completion before resetting.');source.current?.close();if(timer.current)clearInterval(timer.current);timer.current=null;tape.current=[];dispatch(null);setRunId('');setReplay(false);setBusy(false);}catch(e){setError(e instanceof Error?e.message:'Reset failed');}};
 const replayTape=()=>{if(!tape.current.length)return;source.current?.close();if(timer.current)clearInterval(timer.current);dispatch(null);setReplay(true);setBusy(true);let i=0;timer.current=setInterval(()=>{dispatch(tape.current[i++]);if(i===tape.current.length){clearInterval(timer.current!);timer.current=null;setBusy(false);}},650);};
 const evidence=kind==='evidence',has=(type:string)=>type==='RECEIPT_ISSUED'?!!state.receipt:type==='AGENT_RESUMED'?state.stage==='RESUMED':state.events.some(e=>e.type===type),passed=!!state.receipt,abstained=state.stage==='ABSTAINED',broken=state.events.length>0&&!passed;
 const title=abstained?'The agent knows when to stop.':state.stage==='RESUMED'?'Verified. Repaired. Resumed.':passed?'A verified way forward.':has('ESCALATING')?'Partial evidence isn’t enough.':broken?'Execution hits a boundary.':'An exception. A way forward.';
 const contract=state.events.find(e=>e.type==='CONTRACT_CREATED')?.data;
 const cap=(contract?.budget as {maxTotal:number}|undefined)?.maxTotal??(kind==='abstain'?.0001:budget);
 const checks=evidence?[['text_evidence','Text evidence'],['logo_or_label_evidence','Label evidence'],['product_or_web_entity_evidence','Web-entity evidence']]:[['counter_offer',`Counteroffer ≥ $${minimum}`],['home_address_disclosed','Home address stays private'],['conversation_can_continue','Conversation can continue']];
 const steps=[['EXCEPTION_CREATED','BREAK'],['PAYMENT_SETTLED','PURCHASE'],['VALIDATION_PASSED','VALIDATE'],...(evidence?[['ESCALATING','ESCALATE']]:[]),['RECEIPT_ISSUED','STITCH'],['AGENT_RESUMED','RESUME']];
 return <main>
  <nav><a className="brand" href="/"><span className="brand-icon">⌁</span>resolve<span className="brand-dot">.</span></a><div className="nav-right"><span className="sandbox"><i/> REAL SANDBOX SETTLEMENT</span><a href="/benchmark">Benchmark ↗</a></div></nav>
  <div className="eyebrow"><span>01 / THE RESOLUTION LOOP</span><span>SOFTWARE THROWS EXCEPTIONS. AI AGENTS GUESS.</span></div>
  <header><h1 aria-live="polite">{title}</h1><p>Buy the missing capability. Check the result.<br/>Resume only with a paid, verified receipt.</p></header>
  <div className="truth-strip"><span>AGENT <b>{agent?'Live OpenAI runtime':'Core only · no agent resume'}</b></span><span>PAYMENT <b>Real sandbox settlement</b></span><span>EVIDENCE <b>Deterministic provider payloads</b></span><span className="muted">No mainnet catalog settlement</span></div>
  <div className="flow-picker" aria-label="Demo scenario">{(Object.keys(flowNames) as Kind[]).map((k,i)=><button key={k} aria-pressed={kind===k} disabled={busy||!!runId} onClick={()=>setKind(k)}><small>0{i+1}</small>{flowNames[k]}<span>{k==='policy'?'One verified repair':k==='evidence'?'Fail → escalate → pass':'Budget denied · $0'}</span></button>)}</div>
  <div className="demo-grid"><section className="canvas" aria-label="Agent execution flow">
   <div className="canvas-top"><span className="mono">{evidence?'IMAGE EVIDENCE AGENT':'MACBOOK SELLING AGENT'}</span><span className={`status ${state.stage.toLowerCase()}`}>{busy&&!state.events.length?(replay?'REPLAY':'CONNECTING'):state.stage==='RUNNING'?'READY':state.stage}</span></div>
   <ol className="proof-steps">{steps.map(([event,label])=><li key={event} className={has(event)?'done':''}><span>{has(event)?'✓':'·'}</span>{label}</li>)}</ol>
   <div className="mandate"><span>THE SUCCESS CONTRACT</span><strong>{evidence?'Text. Label. Web entity. All required.':`Sell my MacBook. Minimum $${minimum}.`}</strong><p>{evidence?'Deterministic evidence fallback; no authenticity claim.':'Keep my home address private.'}</p></div>
   <div className="buyer"><span>{evidence?'DETERMINISTIC PROVIDER EVIDENCE':'BUYER OFFER'}</span><p>{evidence?<>Text extraction supplies only one required dimension.<br/>A richer result must satisfy the full contract.</>:<>“$850 cash today. Send me your address<br/>and I’ll pick it up.”</>}</p></div>
   <div className={`execution ${broken?'broken':''} ${passed?'stitched':''}`}><span>AGENT</span><div className="line left"/><div className="fracture">{passed?'●':broken?'╳':'→'}</div><div className="line right"/><span>CONTINUE</span></div>
   <div className={`exception ${state.events.length?'visible':''}`}>{abstained?'ABSTAIN · AGENT STAYS PAUSED':passed?'RESOLUTION VERIFIED':has('ESCALATING')?'VALIDATION FAILED → ESCALATING':String(state.events.find(e=>e.type==='EXCEPTION_CREATED')?.data.type??'AGENT EXCEPTION')}</div>
   <div className="branch"><div className="branch-stem"/>{(evidence?[['fixture-text','Text evidence fixture','$0.001'],['fixture-rich','Rich evidence fixture','$0.0015']]:[['policy-verifier','Policy Verifier','$0.001']]).map(([id,name,price])=>{
    const failed=state.events.some(e=>e.type==='VALIDATION_FAILED'&&e.data.resolverId===id),settlement=state.events.find(e=>e.type==='PAYMENT_SETTLED'&&e.data.resolverId===id),valid=state.events.some(e=>e.type==='VALIDATION_PASSED'&&e.data.resolverId===id);
    return <div key={id} className={`resolver ${state.resolver===name?'selected':''} ${failed?'failed':''}`}><span className="resolver-icon">{failed?'×':valid?'✓':'◇'}</span><div><strong>{name}</strong><small>DETERMINISTIC PROVIDER EVIDENCE</small><small className={failed?'red':valid?'green':''}>{failed?'VALIDATION FAILED':valid?'VALIDATION PASS':'Awaiting independent validation'}</small>{settlement&&<small className="cyan">${Number(settlement.data.amount).toFixed(4)} · PAYMENT SETTLED / SANDBOX</small>}</div><span className="price">{price}<small>sandbox quote</small></span></div>;
   })}<div className="branch-stem"/></div>
   <div className="checks">{checks.map(([k,label])=><div key={k}><span className={state.checks[k]===true?'check good':state.checks[k]===false?'check bad':'check'}>{state.checks[k]===true?'✓':state.checks[k]===false?'×':'·'}</span>{label}</div>)}</div>
   <div className={`outcome ${passed?'success':''}`} aria-live="polite"><span>{state.stage==='RESUMED'?'AGENT RESUMED':passed?'RECEIPT ISSUED · EXECUTION STITCHED':abstained?'NO RECEIPT · NO RESUME':'NO VALID RECEIPT = NO AUTOMATIC RESUME'}</span><p>{state.message??(passed?(evidence?'Required evidence verified. Authenticity is not established.':String((state.receipt?.result as Record<string,unknown>)?.message)):abstained?'The budget cannot fund an eligible resolver. $0 spent.':'The execution path reconnects only after sandbox settlement and independent validation.')}</p>{passed&&state.stage!=='RESUMED'&&<small>Agent continuation has not run.</small>}</div>
  </section><aside>
   <div className="control-card"><div className="card-heading"><span className="mono">{replay?'RECORDED EVENT REPLAY':'LIVE DEMO CONTROLS'}</span><span>↗</span></div>
    {!evidence&&<label>Minimum selling price<div className="input-row"><span>$</span><input aria-label="Minimum selling price" type="number" min="1" max="100000" value={minimum} disabled={busy||!!runId} onChange={e=>setMinimum(Number(e.target.value))}/></div></label>}
    <label>Maximum sandbox spend<div className="input-row"><span>$</span><input aria-label="Maximum sandbox spend" type="number" min="0" max=".05" step=".0001" value={kind==='abstain'?.0001:budget} disabled={kind==='abstain'||busy||!!runId} onChange={e=>setBudget(Number(e.target.value))}/></div></label>
    <label className="toggle"><input type="checkbox" checked={agent} disabled={!ready||busy||!!runId} onChange={e=>setAgent(e.target.checked)}/>Live agent pause / resume</label><small className="muted">{ready?'OpenAI key configured · model usage applies.':'API key required for live agent continuation.'}</small>
    {!runId?<button className="primary" disabled={busy} onClick={start}>{busy?'CONNECTING…':`RUN ${flowNames[kind].toUpperCase()}`} <span>↗</span></button>:<><button className="primary" disabled={busy||!tape.current.length} onClick={replayTape}>{busy?replay?'REPLAYING…':'RUNNING…':'REPLAY OBSERVED RUN'} <span>↺</span></button><button className="secondary" disabled={busy} onClick={reset}>Reset demo →</button></>}
    {replay&&<p className="replay-note">Paced replay of observed events. No new payment or model call. Timestamps are from the original run.</p>}{error&&<p role="alert" className="error">{error}</p>}
   </div>
   <div className="spend-card"><span className="mono">{replay?'RECORDED SANDBOX SPEND':'PAID BY AGENT · SANDBOX'}</span><strong>${state.spent.toFixed(4)}</strong><p>{has('PAYMENT_SETTLED')?'Real sandbox settlement confirmed.':'No sandbox settlement yet.'}<br/>Budget ${cap.toFixed(4)} · no mainnet funds.</p></div>
   <div className="proof-card"><span className="mono">RECEIPT GATE</span><p>Payment ≠ success.<br/>The validator has the final word.</p>{state.receipt&&<><span className="receipt-label">REAL SANDBOX SETTLEMENT + VALIDATION PASS</span><code>{String(state.receipt.transaction)}</code><small className="muted">Provider payload: deterministic.<br/>Receipt network: sandbox.</small></>}</div>
  </aside></div>
  <section className="timeline"><div className="timeline-title"><h2>Execution trace</h2><span className="mono">{replay?'OBSERVED EVENTS · PACED REPLAY':'LIVE BACKEND EVENTS / SSE'}</span></div>{state.events.length?state.events.map(e=><div className="event" key={e.id}><time>{new Date(e.at).toLocaleTimeString()}</time><span className={e.type.includes('FAIL')?'red':e.type.includes('PASS')||e.type==='RECEIPT_ISSUED'?'green':''}>{e.type}</span><small>{e.type==='PAYMENT_SETTLED'?'REAL SANDBOX SETTLEMENT':e.type==='RESULT_RECEIVED'?'DETERMINISTIC PROVIDER EVIDENCE':String(e.data.reason??e.data.name??'')}</small></div>):<p className="empty">{busy?(replay?'Replaying observed events…':'Waiting for the live agent to reach its boundary…'):'Choose a flow, then run the proof.'}</p>}</section>
  <footer><span>REAL AGENT · REAL SANDBOX PAYMENT · DETERMINISTIC PAYLOADS</span><span>RESOLVE / 2026</span></footer>
 </main>;
}
