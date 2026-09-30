# Resolve — AI_RULES.md

**Mode:** hackathon execution / September 30, 2026  
**Goal:** ship the smallest credible system that can win a 150→5 finalist screen.

## 1. Mission

Build exactly this loop:

```text
AgentException
→ ResolutionContract
→ eligible resolver selection
→ BudgetGuard
→ machine payment
→ resolver output
→ independent SuccessContract validation
→ ResolutionReceipt
→ original agent resumes
```

Resolve is **verifiable exception resolution for autonomous agents**.

Resolve is NOT a marketplace, wallet, generic model router, generic guardrail, escrow network, human-task marketplace, MCP directory, trading bot, or multi-agent framework.

## 2. Priority order

When instructions conflict, follow:

```text
AI_RULES.md
> PRD.md
> Architecture.md
> PLAN.md
> REFERENCE_REPOS.md
```

Never invent a reconciliation. Report the conflict briefly.

## 3. Canonical names

Use these exact names everywhere:

- `AgentException`
- `ResolutionContract`
- `SuccessContract`
- `Resolver`
- `ResolverAttempt`
- `ResolutionReceipt`
- `BudgetGuard`
- `ResolutionLadder`

## 4. Non-negotiable invariants

1. **No valid ResolutionReceipt = no automatic resume.**
2. Resolver output is not success. The independent validator decides.
3. Budget enforcement is deterministic code, never free-form LLM reasoning.
4. Fail closed on timeout, malformed output, unknown payment state, schema failure, missing evidence, or budget denial.
5. Never fabricate payment settlement, transaction IDs, benchmark results, resolver success rates, or provider output.
6. Never expose private keys or wallet secrets to a model, browser, log, or committed file.
7. Deterministic demo fallback may replace external I/O only; it must still execute the real planner, BudgetGuard, validator, escalation, receipt, and resume code.
8. Benchmark baselines and Resolve must run the same fixture set.
9. UI state must come from canonical backend events or canonical fixture-event tapes using the same reducer.
10. No chain-of-thought in UI/logs; show structured reason codes only.

## 5. Locked stack

Project-owned production code:

```text
TypeScript
Node.js
Express
Next.js + React
Tailwind CSS
Zod
SQLite + better-sqlite3
OpenAI Agents JS (@openai/agents)
SSE
Vitest
npm + package-lock.json
```

### Payment stack — hackathon fast path

Use **Solana Foundation's current Pay tooling first**:

1. `pay` / `@solana/pay` for sandbox smoke tests, provider discovery, debugger, and agent-native paid API calls.
2. `@solana/pay-kit` for the simplest TypeScript/Express paid route/client integration when its current documented x402 path works in the environment.
3. `x402-foundation/x402` TypeScript packages are the fallback/direct-protocol implementation when needed.

Do **not** install both payment SDK stacks preemptively. Pick the first one that passes the payment proof and keep it.

### Forbidden stack drift

Do not introduce Python, Go, Rust, Java, Bun, Deno, Fastify, Hono, NestJS, LangChain, CrewAI, AutoGen, Prisma, Drizzle, Postgres, Redis, Supabase, Firebase, vector DBs, WebSockets, Axios, Docker, Kubernetes, microservices, or another package manager unless a verified blocker exists and the human explicitly approves it.

## 6. Today's public-code reuse policy

### USE DIRECTLY

- `solana-foundation/pay` — CLI/sandbox/debugger/provider discovery.
- `solana-foundation/pay-kit` — current TypeScript payment gates/client if verified working.
- `openai/openai-agents-js` — interruption/run-state resume mechanics.

### USE EXISTING PAID PROVIDERS INSTEAD OF BUILDING THEM

For the escalation demo, prefer existing Pay.sh catalog providers:

- `solana-foundation/alibaba/ocr` — cheap OCR/evidence extractor, catalog price currently shown as ~$0.001/request.
- `solana-foundation/google/vision` — richer image evidence, catalog price currently shown as ~$0.0015/request.

Do not build our own specialist model gateway unless both external providers are unusable.

### FALLBACK REFERENCE

- `x402-foundation/x402` — direct x402 V2/SVM client/server.
- `suhaasgaddala/x402-model-gateway` — service-shape reference only.
- Cloudflare x402 example — payment-aware fetch ergonomics only.
- Skeleton Key — proof/demo mechanics only.

## 7. Payment implementation rule

Before writing payment code:

```bash
brew install pay || npm install -g @solana/pay
pay --version
pay --sandbox curl https://debugger.pay.sh/mpp/quote/AAPL
```

A successful sandbox 402→payment→retry→response proves the sponsor payment tooling works.

For JSON/non-interactive shell integration, prefer documented `--no-dna` behavior.

If direct TypeScript integration is needed, follow current Pay.sh/Pay Kit docs, not memory.

### 10-minute escape hatch

If one payment integration path consumes >10 minutes without a successful paid request:

1. stop debugging it;
2. switch to the next approved payment path;
3. keep the `PaymentAdapter` interface unchanged.

Never let protocol plumbing consume the hackathon.

## 8. Resolver rules

Every resolver has:

```ts
interface Resolver {
  manifest(): ResolverManifest;
  resolve(contract: ResolutionContract): Promise<ResolverResult>;
}
```

Resolver output cannot self-certify success.

P0 resolver set:

1. **Policy Verifier** — deterministic local Resolver, paid/gated if fast; used in hero MacBook scenario.
2. **Alibaba OCR** — real Pay.sh catalog resolver for cheap image evidence.
3. **Google Vision** — real Pay.sh catalog resolver for richer evidence/escalation.

Human is visual/conceptual only unless everything else is finished.

## 9. Success validation

Hero checks are deterministic:

```text
counter_offer >= minimum_price
home_address_disclosed == false
conversation_can_continue == true
```

Escalation demo SuccessContract requires structured evidence such as:

```text
text_evidence
logo_or_label_evidence
product_or_web_entity_evidence
```

Cheap OCR may satisfy text evidence but not the richer fields. That is a legitimate validation failure, not an artificial error.

Do not claim the system proves authenticity. It proves that the required evidence contract was satisfied.

## 10. Planner

Hard filter first:

- capability
- max attempt spend
- max total spend
- deadline
- supported payment rail/network
- required output shape

Then rank eligible resolvers with an explainable estimate, e.g.:

```text
expected_resolution_cost = quoted_price / max(observed_success_rate, epsilon)
```

If there is no useful history, use coarse seeded priors by capability class. Do not invent precise probabilities.

## 11. Attempt terminal states

Exactly one:

```text
PASS
VALIDATION_FAIL
PAYMENT_FAIL
TIMEOUT
MALFORMED
BUDGET_DENIED
```

Only `PASS` produces a `ResolutionReceipt`.

## 12. Canonical events

```text
EXCEPTION_CREATED
CONTRACT_CREATED
RESOLVER_SELECTED
PAYMENT_REQUIRED
PAYMENT_AUTHORIZED
PAYMENT_SETTLED
RESULT_RECEIVED
VALIDATION_FAILED
ESCALATING
VALIDATION_PASSED
RECEIPT_ISSUED
AGENT_RESUMED
ABSTAINED
```

Do not invent near-duplicate event names.

## 13. Finalist UI rules

Visual thesis:

> **A broken autonomous-agent execution path repairs itself by purchasing and verifying a resolution.**

The demo must not look like an admin dashboard.

Signature behavior:

```text
RUNNING
→ execution line breaks
→ AGENT EXCEPTION
→ ResolutionContract
→ purchasable branches
→ payment pulse
→ validation
→ ResolutionReceipt
→ resolution stitch
→ AGENT RESUMED
```

A judge watching muted for ~15 seconds must understand:

1. something broke;
2. the agent bought help;
3. the result was checked;
4. the workflow continued.

Readable labels:

```text
AGENT EXCEPTION
$X PAID BY AGENT
VALIDATION FAILED
ESCALATING
RESOLUTION VERIFIED
AGENT RESUMED
ABSTAIN
```

## 14. Benchmark rules

Compare exactly:

```text
CHEAPEST_ONLY
PREMIUM_ONLY
RESOLVE
```

North star:

```text
cost_per_verified_resolution = total_spend / verified_resolutions
```

Also calculate verified success rate, total spend, latency, validation failures, escalations, abstentions, resolver mix, and unverified resumes.

Never pre-write the winning percentage.

## 15. Coding-agent protocol

For every task:

1. inspect existing code;
2. change minimum files;
3. preserve canonical contracts;
4. define observable done condition;
5. implement smallest patch;
6. run smallest relevant test/typecheck;
7. stop.

Report only:

```text
PHASE:
CHANGED:
VERIFIED:
BLOCKERS:
NEXT:
```

Do not repeatedly summarize the project.

## 16. Absolute cut list

Unless the killer demo is already finished, do not build:

- human marketplace
- broad provider marketplace UI
- Pay.sh provider publication/PR
- payment channels/sessions
- multi-chain
- user accounts/auth
- generalized reputation
- escrow
- tokenomics
- complex ML/RL
- multi-agent swarms
- production deployment infrastructure

## Approved clarification — September 30, 2026

Partial-evidence resolvers are eligible when they match at least one required evidence/check dimension, have validator-compatible output, materially advance resolution, and meet budget/deadline/network constraints. They need not satisfy the full SuccessContract alone. Only the independent validator determines full success; OCR may fail full validation before escalation.

A ResolutionReceipt and automatic resume require both actual SETTLED payment and PASS verification. Unpaid development runs may return internal VALIDATED_UNPAID only: no receipt, settlement event, or automatic resume. This internal state is not a new canonical event or ResolverAttempt terminal state.
