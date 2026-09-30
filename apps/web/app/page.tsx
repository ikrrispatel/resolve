import styles from './home.module.css';
import {policyManifest} from '../../../packages/core/scenarios';
export default function Home(){
 const quote=policyManifest('https://example.invalid').quotedPriceUsd;
 return <main className={styles.home}>
  <nav><a className="brand" href="/"><span className="brand-icon">⌁</span>resolve<span className="brand-dot">.</span></a><div className="nav-right"><a href="/demo">Live demo ↗</a><a href="/benchmark">Benchmark ↗</a></div></nav>
  <section className={styles.hero}>
   <div><p className={styles.kicker}>Verifiable exception resolution for autonomous agents</p><h1>Software throws<br/>exceptions.<br/><span>AI agents guess.</span></h1><p className={styles.thesis}>Resolve gives autonomous agents an exception handler they can buy.</p><div className={styles.actions}><a href="/demo">Run live demo <span>↗</span></a><a href="/benchmark">View benchmark <span>→</span></a></div><p className={styles.boundary}>NO VALID RESOLUTION RECEIPT = NO AUTOMATIC RESUME</p></div>
  </section>
  <section className={styles.trace} aria-label="Illustrative policy resolution graph">
   <p>EXECUTION / REPAIR <span>ILLUSTRATIVE · NOT A LIVE PAYMENT</span></p>
   <div className={styles.graph}>
    <span className={styles.start}>AGENT EXECUTION</span><span className={styles.end}>VERIFIED CONTINUATION</span>
    <div className={styles.rail}/><span className={styles.break}>╳</span><span className={styles.repair}>●</span>
    <div className={styles.detour}/><svg className={styles.returnPath} viewBox="0 0 1000 265" preserveAspectRatio="none" aria-hidden="true"><path d="M455 145 L735 72" fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke"/></svg>
    <div className={styles.resolverNode}><b>● Policy Verifier</b><span>${quote.toFixed(3)} sandbox example</span><span>Independent validation → receipt</span></div>
   </div>
   <small>A boundary becomes a contract. A verified result repairs the execution path.<br/>Run the demo to observe sandbox settlement and validation.</small>
  </section>
  <section className={styles.sequence} aria-label="The resolution loop"><div><span>01 / BREAK</span><h2>AgentException</h2><p>Make the boundary explicit.</p></div><div><span>02 / BUY</span><h2>ResolutionContract<br/>→ paid resolver</h2><p>Purchase a bounded way forward.</p></div><div><span>03 / VERIFY</span><h2>SuccessContract<br/>→ ResolutionReceipt → resume</h2><p>The validator decides. The original agent continues.</p></div></section>
  <footer><span>REAL SANDBOX PAYMENT · DETERMINISTIC PROVIDER PAYLOADS</span><span>RESOLVE / 2026</span></footer>
 </main>;
}
