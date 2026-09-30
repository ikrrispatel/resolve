import styles from './home.module.css';
import {policyManifest} from '../../../packages/core/scenarios';
export default function Home(){
 const quote=policyManifest('https://example.invalid').quotedPriceUsd;
 return <main className={styles.home}>
  <nav><a className="brand" href="/"><span className="brand-icon">⌁</span>resolve<span className="brand-dot">.</span></a><div className="nav-right"><a href="/demo">Live demo ↗</a><a href="/benchmark">Benchmark ↗</a></div></nav>
  <section className={styles.hero}>
   <div><p className={styles.kicker}>Verifiable exception resolution for autonomous agents</p><h1>Software throws<br/>exceptions.<br/><span>AI agents guess.</span></h1><p className={styles.thesis}>Resolve gives autonomous agents an exception handler they can buy.</p><div className={styles.actions}><a href="/demo">Run live demo <span>↗</span></a><a href="/benchmark">View benchmark <span>→</span></a></div><p className={styles.boundary}>NO VALID RESOLUTION RECEIPT = NO AUTOMATIC RESUME</p></div>
   <div className={styles.trace} aria-label="Illustrative policy resolution trace"><p>EXECUTION TRACE <span>ILLUSTRATIVE / SANDBOX</span></p><ol>
    <li>goal <span>sell_macbook</span></li><li>running</li><li>action</li><li className={styles.fracture}>╳ <b>POLICY_CONFLICT</b></li><li>ResolutionContract</li><li className={styles.active}>resolver selected</li><li className={styles.active}>${quote.toFixed(3)} paid <span>sandbox example</span></li><li>validator</li><li className={styles.verified}>● <b>VERIFIED</b></li><li className={styles.verified}>resumed</li>
   </ol><small>Illustration of the policy flow, not a live payment.<br/>Run the demo to observe settlement and validation.</small></div>
  </section>
  <section className={styles.sequence} aria-label="The resolution loop"><div><span>01 / BREAK</span><h2>AgentException</h2><p>Make the boundary explicit.</p></div><div><span>02 / BUY</span><h2>ResolutionContract<br/>→ paid resolver</h2><p>Purchase a bounded way forward.</p></div><div><span>03 / VERIFY</span><h2>SuccessContract<br/>→ ResolutionReceipt → resume</h2><p>The validator decides. The original agent continues.</p></div></section>
  <footer><span>REAL SANDBOX PAYMENT · DETERMINISTIC PROVIDER PAYLOADS</span><span>RESOLVE / 2026</span></footer>
 </main>;
}
