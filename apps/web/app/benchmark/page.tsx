'use client';
import {useEffect,useState} from 'react';
import styles from './benchmark.module.css';
type Attempt={resolverId:string;quotedCost:number;validationPassed:boolean;escalated:boolean};
type Case={id:string;kind:string;validated:boolean;quotedCost:number;attempts:number;trace:Attempt[]};
type Result={strategy:string;fixtureCount:number;validated:number;validationRate:number;quotedSpend:number;quotedCostPerValidatedResolution:number|null;validationFailures:number;escalations:number;abstentions:number;unverifiedResumes:number;resumes:number;cases:Case[]};
const money=(n:number|null)=>n===null?'—':`$${n.toFixed(4)}`;
export default function Benchmark(){
 const [data,setData]=useState<{results:Result[]}|null>(null),[error,setError]=useState('');
 useEffect(()=>{fetch('/api/benchmark').then(r=>{if(!r.ok)throw Error('BENCHMARK_UNAVAILABLE');return r.json();}).then(setData).catch(()=>setError('Benchmark unavailable. The benchmark service is currently unreachable.'));},[]);
 const hero=data?.results.find(r=>r.strategy==='RESOLVE');
 const premium=data?.results.find(r=>r.strategy==='PREMIUM_ONLY');
 const saving=hero?.quotedCostPerValidatedResolution!=null&&premium?.quotedCostPerValidatedResolution?100*(1-hero.quotedCostPerValidatedResolution/premium.quotedCostPerValidatedResolution):null;
 const sameSuccess=hero&&premium&&hero.validationRate===premium.validationRate;
 const exampleId=hero?.cases.find(c=>c.kind==='rich')?.id;
 const rows:Array<[string,(r:Result)=>string]>=[['Verified success rate · validator only',r=>`${(r.validationRate*100).toFixed(1)}%`],['Cost / verified result · hypothetical',r=>money(r.quotedCostPerValidatedResolution)],['Total spend · hypothetical',r=>money(r.quotedSpend)],['Validation failures',r=>String(r.validationFailures)],['Escalations',r=>String(r.escalations)],['Abstentions',r=>String(r.abstentions)],['Unverified resumes · no resumes executed',r=>String(r.unverifiedResumes)]];
 return <main className={styles.page}>
  <nav><a className="brand" href="/"><span className="brand-icon">⌁</span>resolve<span className="brand-dot">.</span></a><div className="nav-right"><span className="sandbox">VALIDATION ONLY</span><a href="/demo">Live demo ↗</a></div></nav>
  <div className="eyebrow"><span>02 / THE COST OF A VERIFIED WAY FORWARD</span><span>SAME FIXTURES. THREE DECISION PATHS.</span></div>
  <header><h1>{hero?`${hero.fixtureCount} deterministic fixtures`:"Every attempt counts."}</h1><p>Same contracts. Same independent validator.<br/>Different paths to a verified result.</p></header>
  <div className={styles.disclosure}>VALIDATION-ONLY / NO PAYMENTS / NO RECEIPTS / NO AGENT RESUMES<span>Deterministic synthetic evidence. Dollar amounts are hypothetical quotes, never observed settlement.</span></div>
  {error&&<p role="alert" className="error">{error}</p>}{!data&&!error&&<p className="empty">Evaluating all three strategies…</p>}
  {data&&<>
   <section className={styles.comparison} aria-label="Premium and Resolve aggregate comparison">{[premium,hero].map(r=>r&&<div key={r.strategy}><span className="mono">{r.strategy==='RESOLVE'?'RESOLVE':'PREMIUM'}</span><strong>{(r.validationRate*100).toFixed(1)}<small>%</small></strong><p>validator success</p><b>{money(r.quotedCostPerValidatedResolution)} <span>/ verified*</span></b></div>)}</section>
   {sameSuccess&&saving!==null&&saving>0&&<p className={styles.takeaway}>Same validator success as premium.<br/><span>~{Math.round(saving)}% lower hypothetical cost per verified result.</span></p>}
   <p className={styles.footnote}>* Deterministic synthetic benchmark; hypothetical resolver quotes; no benchmark payments executed. “Verified” means validator PASS.</p>
   <div className={styles.sectionHeading}><h2>One contract. Three execution paths.</h2><span className="mono">{exampleId} / RICH EVIDENCE</span></div>
   <p className={styles.contract}>REQUIRES <b>text evidence</b> + <b>label evidence</b> + <b>web-entity evidence</b></p>
   <div className={styles.lanes}>{data.results.map(r=>{const c=r.cases.find(c=>c.id===exampleId);return <section key={r.strategy} className={`${styles.lane} ${r.strategy==='RESOLVE'?styles.resolve:''}`} aria-label={r.strategy}>
    <h3>{r.strategy}</h3><div className={styles.start}>CONTRACT RECEIVED<span>↓</span></div>
    <ol>{c?.trace.map((a,i)=><li key={`${a.resolverId}-${i}`}>
     {a.escalated&&<div className={styles.escalate}>↓ ESCALATING</div>}
     <div className={`${styles.attempt} ${a.validationPassed?styles.pass:styles.fail}`}><span className="mono">ATTEMPT {i+1} · SYNTHETIC RESOLVER</span><div><strong>{a.resolverId==='ocr'?'OCR':a.resolverId==='vision'?'Vision':a.resolverId}</strong><code>{money(a.quotedCost)}</code></div><small>Hypothetical attempt cost</small><b>{a.validationPassed?'✓ VALIDATION PASS':'× VALIDATION FAILED'}</b></div>
    </li>)}</ol>
    <div className={`${styles.result} ${c?.validated?styles.pass:styles.fail}`}><strong>{c?.validated?'VERIFIED · VALIDATOR ONLY':'UNVERIFIED'}</strong><p>{c&&c.attempts>1?'Escalation executed': 'No escalation'}</p><div>Final spend <b>{money(c?.quotedCost??null)}</b></div><small>Hypothetical · no payment executed</small></div>
   </section>;})}</div>
   <p className={styles.footnote}>An escalation can cost more than premium alone on an individual case. The lane totals above include every attempted resolver; aggregate savings are across all fixtures.</p>
   <div className={styles.sectionHeading}><h2>Aggregate results</h2><span className="mono">{data.results[0]?.fixtureCount} IDENTICAL FIXTURES PER STRATEGY</span></div>
   <div className={styles.tableWrap}><table><caption>Measured validation outcomes. All cost metrics use hypothetical quotes.</caption><thead><tr><th scope="col">METRIC</th>{data.results.map(r=><th key={r.strategy} scope="col">{r.strategy}</th>)}</tr></thead><tbody>{rows.map(([name,value])=><tr key={name}><th scope="row">{name}</th>{data.results.map(r=><td key={r.strategy} className={r.strategy==='RESOLVE'?styles.accent:''}>{value(r)}</td>)}</tr>)}</tbody></table></div>
   <p className={styles.footnote}>Policy, text, rich-evidence, budget and adversarial fixtures run through the existing planner, BudgetGuard and independent validator. No payment adapter or agent runs in this benchmark. Zero unverified resumes is not evidence of resume safety when no resumes execute.</p>
  </>}
  <footer><span>VALIDATION-ONLY / NO MAINNET CATALOG SETTLEMENT CLAIMED</span><span>REPRODUCE: npm run benchmark</span></footer>
 </main>;
}
