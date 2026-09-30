# Resolve

Verifiable exception resolution for autonomous agents. Read `docs/AI_RULES.md` first; document priority is AI_RULES → PRD → Architecture → PLAN → REFERENCE_REPOS → HYPER_PROMPT. The approved September 30 clarifications are encoded in the first four documents.

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:3000/demo and http://localhost:3000/benchmark. API listens on loopback port 4310. Only one demo runs at a time. `npm run demo:reset` clears in-memory presentation history, never chain history.

```sh
npm run payment:smoke
npm run demo:policy
npm run demo:escalate -- --agent
npm run demo:abstain
npm run benchmark
npm test
npm run typecheck
npm run build
```

The smoke and policy commands perform real x402/SVM settlement on the hosted Surfpool **sandbox**, with ephemeral in-memory wallets. They do not spend mainnet funds. The adapter checks the SDK settlement receipt and queries the sandbox RPC for its transaction status before reporting SETTLED. Sandbox availability is an external dependency.

The policy command produces a paid, independently validated receipt. It does not claim agent continuation. Set `OPENAI_API_KEY` locally in `.env`, then run `npm run demo:policy -- --agent` to exercise the real OpenAI Agents JS interruption and same-state continuation. The approved tool consumes the verified receipt result, never the original proposed message. Messages go only to the local negotiation transcript; no buyer is contacted. This live SDK path was verified on September 30, 2026, with a real OpenAI request, sandbox settlement, independent validation, and same-run resume. Evidence is recorded in `outputs/agent-payment-proof.json`.

The benchmark uses 44 identical synthetic fixtures across CHEAPEST_ONLY, PREMIUM_ONLY, and RESOLVE. It measures planner/validator outcomes and hypothetical quoted cost. It issues no receipts, settles no payments, and resumes no agents. It is not a live-provider benchmark. Results are written to `outputs/benchmark.json`.

## Current external dependency blockers

The Pay CLI sandbox could not reliably complete its signed retry. Pay Kit reproduced the MPP verifier failure. The official x402 Foundation SVM/Express implementation passed and is the application's only payment stack. Earlier diagnostic installations and temporary wallet material were excluded from migration to this repository.

Google Vision currently advertises x402/exact at 1500 USDC atomic units ($0.0015), mainnet. Alibaba OCR currently advertises x402/upto with a 100000 atomic-unit cap ($0.10), rather than the historical $0.001 fixed request quoted in the spec. Its session rail is deliberately not used. Catalog request/normalization functions exist. Pay MCP account access and a persistent $0.50 aggregate reservation cap are implemented; real escalation remains incomplete. Current live blocker: Apple Keychain rejected the Vision payment authorization. OCR also hit a Pay permission/network parsing failure after its unsupported MPP session path was denied. Failed and unknown calls retain their full reservations; reserved amounts must not be reported as actual spend. `npm run demo:escalate -- --agent` now runs the explicitly labeled sandbox fixture fallback: synthetic text evidence → real sandbox payment → independent validation failure → richer synthetic evidence → second real sandbox payment → PASS → sandbox receipt → same OpenAI agent resumes. It does not call live catalog providers or spend mainnet funds. Public event evidence is in `outputs/evidence-event-proof.json`. The UI offers this same flow.

SQLite is deferred under Architecture §14. All run/event state is process-local. Server restart discards demo state. No deployment, auth, marketplace or specialist gateway has been added.

## Safety boundaries

- No SETTLED payment + PASS validation: no receipt and no automatic resume.
- Unknown payment state stops escalation; it is never treated as zero-cost retry permission.
- Prices use integer microdollar comparisons, and actual challenge terms must fit the cap before signing.
- Client only accepts exact SVM/USDC offers at configured origins; redirect following is disabled.
- The hosted sandbox uses mainnet's CAIP identifier but a pinned sandbox RPC and ephemeral signers. UI receipts explicitly say sandbox.
- Keep `.env`, wallets, caches and logs out of Git. Do not paste keys into chat.

## Current verified fallback

The one additional authorized Vision retry checked both the x402 and MPP quote at exactly $0.0015, then made one Pay MCP call. Apple Keychain rejected authorization again. Mainnet signing retries are stopped. No mainnet receipt was issued. Conservative reservations total $0.303 of the $0.50 authorization; this is reserved exposure, not a claim of spend.

The separate sandbox escalation settled two actual transactions for a total 0.0025 sandbox USDC and resumed the live OpenAI Agents JS run only after independent validation. Synthetic fixture evidence remains visibly labeled in results and UI. Mainnet external-provider proof remains incomplete.

Reliability: 28 tests cover budget denial, same-run receipt gating, partial-evidence escalation, malformed results, provider 500, late settlement, unknown payment state, failed specialist, duplicate attempts, and persistent spend caps. The 44-fixture benchmark remains validation-only; its quoted costs are not observed provider spend.

## Final demo controls

Choose Policy pass, Escalation, or Abstention on `/demo`. Live agent pause/resume is enabled when the configured key is available. After a run, Replay observed run replays the same canonical event tape at a presentation pace without making another payment or model call. Original timestamps remain visible. Reset demo clears backend presentation state and the displayed run; it does not alter payments, wallet state, or the mainnet budget ledger.

Final freeze: all three flows passed CLI and browser verification with the live agent enabled. The browser confirms reset/replay and benchmark disclosures. No mainnet catalog settlement is claimed. Source/payment architecture is frozen. Final verification evidence: `outputs/final-verification.json`.
