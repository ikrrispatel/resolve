# Resolve — PLAN.md

**Today:** doors 10:00, kickoff + Pay.sh workshop 11:00, submissions close 16:00, top-5 demos 17:00.

This is a **proof-first build plan**, not a feature checklist.

## 0. Winning proof

A finalist judge should see, in ~60–90 seconds:

```text
agent hits boundary
→ execution breaks
→ ResolutionContract
→ agent buys capability
→ result is independently verified
→ execution repairs and resumes
```

Then:

```text
cheap paid capability fails contract
→ automatic escalation
→ second real paid capability passes
```

Then:

```text
over-budget → ABSTAIN → $0 spent
```

Then one measured benchmark result.

## 1. 10:00–11:00 setup / workshop prep

Do before or during workshop idle time:

```bash
brew install pay || npm install -g @solana/pay
pay --version
pay --sandbox curl https://debugger.pay.sh/mpp/quote/AAPL
```

Also inspect:

```bash
pay skills search "ocr image"
pay skills search "vision image"
pay skills show solana-foundation/alibaba/ocr
pay skills show solana-foundation/google/vision
```

Do not start building a custom payment stack before hearing the workshop guidance.

## 2. 11:00–11:20 — lock the payment path

During Pay.sh workshop, identify the shortest supported TypeScript path for:

1. a pay-gated Express endpoint;
2. a payment-aware client call;
3. external catalog provider calls;
4. obtaining/observing settlement proof safely.

Decision gate:

### Path A
Use `@solana/pay-kit` if the current workshop/docs example works immediately.

### Path B
Use official `pay` CLI as the external paid-call adapter.

### Path C
Use x402 Foundation TS SDK if A/B block the in-app requirement.

**Hard rule:** no payment path gets more than ~10 minutes of debugging without a successful request.

Exit:

```text
unpaid request → 402
paid request → successful response
```

## 3. 11:20–11:50 — core Resolve, CLI only

Implement only:

- Zod schemas;
- BudgetGuard;
- Resolver interface;
- planner;
- validator;
- ResolutionReceipt;
- event emitter.

Hero resolver may initially be deterministic/local.

Exit command:

```text
npm run demo:policy
```

must show:

```text
EXCEPTION_CREATED
CONTRACT_CREATED
RESOLVER_SELECTED
PAYMENT_SETTLED (only when actually settled)
VALIDATION_PASSED
RECEIPT_ISSUED (only when payment is SETTLED and validation is PASS)
```

No frontend yet.

## 4. 11:50–12:20 — original agent pause/resume

Use OpenAI Agents JS official interruption/run-state pattern.

Selling scenario:

```text
minimum $900
home address private
buyer: $850 + address request
```

Exit:

- same run genuinely pauses;
- Resolve executes;
- no receipt = no resume;
- valid receipt causes automatic continuation with verified safe result.

## 5. 12:20–12:50 — real sponsor-ecosystem escalation

Do NOT build a custom specialist model gateway unless catalog calls fail.

Use existing providers:

```text
Alibaba OCR ~$0.001
→ text evidence only
→ FAIL richer SuccessContract
→ ESCALATING
Google Vision ~$0.0015
→ richer evidence
→ PASS
```

Use a fixed public demo image whose expected evidence is known.

Normalize both outputs to `ImageEvidenceResult`.

Exit:

```text
npm run demo:escalate
```

produces two real paid attempts when LIVE.

## 6. 12:50–13:05 — abstention

Add one contract where all eligible resolutions exceed `maxAttempt` or `maxTotal`.

Exit:

```text
ABSTAINED
$0 spent
```

and payment adapter was never invoked.

## 7. 13:05–13:45 — UI: only the finalist canvas

Do not build a dashboard.

Implement `/demo` against canonical fixture events first:

```text
execution line
→ fracture
→ contract
→ resolver branches
→ payment pulse
→ validation
→ stitch
→ resume
```

Required large labels:

```text
AGENT EXCEPTION
$X PAID BY AGENT
VALIDATION FAILED
ESCALATING
RESOLUTION VERIFIED
AGENT RESUMED
```

Then connect the exact same reducer to SSE.

## 8. 13:45–14:15 — benchmark runner

Target **30–60 high-quality fixtures**, not 100 weak fixtures.

Groups:

- policy conflicts;
- evidence/capability gaps;
- abstention;
- adversarial malformed/timeouts/budget failures.

Compare exact same fixtures:

```text
CHEAPEST_ONLY
PREMIUM_ONLY
RESOLVE
```

Metrics:

- verified success rate;
- cost per verified resolution;
- total spend;
- unverified resumes;
- validation failures;
- escalation count.

Run and inspect actual results.

## 9. 14:15–14:35 — benchmark UI / strategy race

Show one representative case in three lanes using **real benchmark outputs**, then aggregate numbers.

Do not fake timings.

Pick exactly one headline after results exist.

Examples only:

```text
X% lower cost per verified resolution
```

or

```text
0 unverified resumes across N cases
```

## 10. 14:35 — hard feature freeze

After this point, no new architecture or major features.

Allowed:

- bug fixes;
- copy/readability;
- provider payload normalization;
- timeout handling;
- reset script;
- demo pacing;
- fallback fixtures.

Not allowed:

- human integration;
- provider publication;
- payment channels;
- new agent framework;
- new database architecture;
- additional demo scenarios.

## 11. 14:35–15:00 — red team

Test:

- provider 500;
- timeout;
- invalid JSON;
- valid HTTP but SuccessContract fail;
- payment failure;
- over-budget;
- duplicate attempt;
- no eligible resolver;
- specialist fail.

Invariant:

```text
NO VALID RECEIPT = NO RESUME
```

## 12. 15:00–15:20 — demo reliability

Required scripts:

```text
npm run demo:reset
npm run demo:policy
npm run demo:escalate
npm run demo:abstain
npm run benchmark
```

Create deterministic provider fixtures from previously observed valid response shapes.

Fallback mode must preserve real orchestration/validation.

## 13. 15:20–15:40 — finalist video / submission

Record a clean backup before the deadline.

Recommended video sequence:

### 0–4 sec

> **Software throws exceptions. AI agents guess.**

### 4–25 sec

MacBook policy conflict → payment → verified stitch → resume.

### 25–45 sec

Real OCR purchase → validation fail → real Vision purchase → pass → stitch.

### 45–52 sec

Budget too low → ABSTAIN → $0.

### 52–70 sec

Strategy race + actual benchmark headline.

### 70–80 sec

Show ResolutionReceipt.

Close:

> **The agent doesn't buy a model. It buys a verified way forward.**

## 14. 15:40–16:00 — submit early

Do not use the last 5 minutes for deployment or feature work.

Submit, verify links/video/repo, then preserve a known-good commit.

## 15. 16:00–17:00 — if selected / live-demo prep

No feature development.

- run live path repeatedly;
- decide LIVE vs deterministic-provider fallback;
- verify network;
- rehearse 90-second pitch;
- optionally let a judge change minimum price or max budget.

## 16. Judge-controlled proof

If asked whether it is hardcoded, change:

```text
minimum price: 900 → 975
```

The contract and resumed response must change.

Or:

```text
max resolution spend → below cheapest resolver
```

Expected:

```text
ABSTAIN
$0 spent
```

## 17. Killer-demo done condition

Done means:

- meaningful interruption;
- machine-readable contract;
- economic resolver selection;
- real/protocol-authentic payment;
- at least one real Pay.sh external provider purchase;
- visible validation failure and automatic escalation;
- receipt-gated resume;
- abstention;
- measured benchmark;
- UI understandable on mute.

Anything else is optional.

## Approved clarification — September 30, 2026

Partial-evidence resolvers are eligible when they match at least one required evidence/check dimension, have validator-compatible output, materially advance resolution, and meet budget/deadline/network constraints. They need not satisfy the full SuccessContract alone. Only the independent validator determines full success; OCR may fail full validation before escalation.

A ResolutionReceipt and automatic resume require both actual SETTLED payment and PASS verification. Unpaid development runs may return internal VALIDATED_UNPAID only: no receipt, settlement event, or automatic resume. This internal state is not a new canonical event or ResolverAttempt terminal state.
