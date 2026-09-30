# Resolve — PRD.md

**Event:** Agent Hackathon, September 30, 2026  
**Prompt:** Build something an agent would buy.  
**Product:** Resolve — verifiable exception resolution for autonomous agents.

## 1. One-sentence product

> **Resolve lets an autonomous agent buy and verify the minimum capability needed to continue when it hits a boundary.**

Opening line:

> **Software throws exceptions. AI agents guess.**

Closing line:

> **The agent doesn't buy a model. It buys a verified way forward.**

## 2. Problem

Agents increasingly have wallets, tools, APIs, models, and permissions, but they still hit runtime boundaries:

- hard user-policy conflict;
- missing capability;
- missing current evidence;
- missing permission;
- downstream output that looks plausible but does not satisfy the task;
- resolution whose price is not economically justified.

Common fallbacks are bad: guess, stop, always use the premium model, always ask a human, or trust any returned response.

## 3. Product loop

```text
Agent executes
→ semantic boundary
→ AgentException
→ ResolutionContract defines what must become true
→ ResolutionLadder finds eligible paid capability
→ BudgetGuard authorizes
→ agent pays
→ result arrives
→ SuccessContract validates independently
→ PASS: ResolutionReceipt
→ original run resumes

FAIL: next eligible resolver
NO ELIGIBLE RESOLVER: abstain safely
```

## 4. Customer and unit of value

Primary customer: **another autonomous agent**.

The agent buys a **resolution attempt** against a `ResolutionContract`, not “an LLM call.”

A `ResolutionReceipt` is the tangible artifact proving:

- which contract was resolved;
- which resolver was purchased;
- amount paid;
- payment status;
- verification status;
- result summary;
- whether original execution resumed.

## 5. Hackathon fast-path product implementation

The product remains Resolve, but commodity payment/provider infrastructure is reused aggressively.

### Payment / discovery

Use the Solana Foundation Pay ecosystem:

- `pay` CLI for sandbox smoke tests, provider discovery, debugger, and fast paid calls;
- current `@solana/pay-kit` TypeScript integration if it passes the first payment proof quickly;
- x402 Foundation SDK only as fallback/direct-protocol implementation.

### Existing external resolver supply

Use real catalog APIs instead of building an unnecessary specialist backend.

P0 external resolver candidates:

- **Alibaba OCR** (`solana-foundation/alibaba/ocr`) — text extraction, catalog currently advertises ~$0.001/request.
- **Google Cloud Vision** (`solana-foundation/google/vision`) — labels/logos/text/web entities/object evidence, catalog currently advertises ~$0.0015/request.

This directly demonstrates an agent purchasing capabilities from the sponsor ecosystem.

## 6. Core domain objects

### AgentException

```ts
interface AgentException {
  id: string;
  type: "POLICY_CONFLICT" | "CAPABILITY_GAP" | "EVIDENCE_GAP" | "PERMISSION_GAP";
  task: string;
  context: Record<string, unknown>;
  valueAtRisk?: number;
  maxResolutionSpend: number;
  deadlineMs: number;
  createdAt: string;
}
```

### ResolutionContract

Defines the state required before resume.

```ts
interface ResolutionContract {
  id: string;
  exceptionId: string;
  requiredState: Record<string, unknown>;
  budget: { maxTotal: number; maxAttempt: number };
  deadlineMs: number;
  success: SuccessContract;
}
```

### ResolutionReceipt

```ts
interface ResolutionReceipt {
  id: string;
  contractId: string;
  resolverId: string;
  cost: number;
  paymentStatus: "SETTLED";
  verificationStatus: "PASS";
  result: Record<string, unknown>;
  createdAt: string;
}
```

**Invariant:** no receipt, no automatic resume.

## 7. Hero demo — consumer selling agent

User mandate:

```text
Sell my MacBook.
Minimum price: $900.
Never reveal my home address.
```

Buyer:

```text
$850 cash today. Send me your address and I'll pick it up.
```

Flow:

1. Agent proposes unsafe action.
2. Execution visibly breaks: `POLICY_CONFLICT`.
3. Resolve builds contract:
   - counteroffer >= $900;
   - private address absent;
   - negotiation remains actionable;
   - max resolution spend $0.05.
4. Resolution Ladder appears.
5. Resolver selected and paid.
6. Output is independently checked.
7. Receipt is issued.
8. Original agent automatically resumes:

```text
I can do $900. If that works, I can send a public pickup location.
```

Audience takeaway:

> **The agent became the customer because it could not safely continue without purchasing a verified resolution.**

## 8. Killer escalation demo — use real Pay.sh catalog services

Scenario: shopping agent needs evidence from a product/collectible image before proceeding with a high-value purchase.

Exception:

```text
CAPABILITY_GAP / EVIDENCE_GAP
value at risk: $2,000
```

SuccessContract requires:

```text
text_evidence
logo_or_label_evidence
product_or_web_entity_evidence
```

Resolution ladder:

1. **Alibaba OCR** (~$0.001) — cheapest; extracts text.
2. **Google Vision** (~$0.0015) — richer image evidence.

Expected live behavior:

```text
Alibaba OCR purchased
→ result arrives
→ text_evidence PASS
→ logo/product evidence missing
→ VALIDATION FAILED
→ ESCALATING
→ Google Vision purchased
→ richer evidence arrives
→ contract PASS
→ ResolutionReceipt
→ agent resumes
```

Important claim discipline:

- Do NOT claim Resolve proved the item authentic.
- Claim Resolve acquired and verified the **required evidence structure** before allowing the workflow to continue.

This is stronger than a synthetic specialist service because judges see the agent purchase two real external capabilities.

## 9. Abstention demo

If cheapest eligible resolution costs more than the allowed budget:

```text
ABSTAIN
$0 spent
```

The execution path remains broken. No receipt, no resume.

## 10. Resolver planner

1. filter by capability;
2. filter by deadline;
3. filter by max attempt and total budget;
4. filter by required output shape/payment support;
5. rank by explainable expected cost to verified resolution;
6. attempt;
7. validate;
8. escalate on failure.

P0 does not need RL or fine tuning.

## 11. Benchmark

Compare:

- `CHEAPEST_ONLY`
- `PREMIUM_ONLY`
- `RESOLVE`

North star:

```text
cost_per_verified_resolution = total_spend / verified_resolutions
```

Secondary metrics:

- verified success rate;
- total spend;
- average latency;
- validation failures;
- escalations;
- abstentions;
- resolver mix;
- unverified resumes.

Target fixture count: **30–60 if time is tight; 60–100 only if core is already stable.**

Do not sacrifice demo reliability for fixture count.

## 12. Finalist-selection UX

Visual thesis:

> **A broken agent execution path repairs itself by purchasing and verifying a resolution.**

Only two presentation surfaces:

- `/demo`
- `/benchmark`

Signature animation is the **Resolution Stitch**:

```text
────────╳────────
        ↓ verified
─────────────────
```

The path reconnects only after `VALIDATION_PASSED + RECEIPT_ISSUED`; resumed state follows `AGENT_RESUMED`.

15-second mute test:

A judge must understand: broke → bought → verified → continued.

## 13. Stack

```text
TypeScript / Node / Express
Next.js / React / Tailwind
Zod shared schemas
SQLite / better-sqlite3
OpenAI Agents JS
SSE
Vitest
npm
Solana Pay / Pay Kit fast path
x402 Foundation fallback
```

## 14. Non-goals

Not building:

- generic agent marketplace;
- provider onboarding;
- human marketplace;
- broad discovery engine;
- wallet product;
- MCP directory;
- reputation network;
- escrow/disputes;
- prediction markets;
- multi-agent swarm;
- RL;
- production auth;
- payment channels/subscriptions;
- multi-chain.

## 15. Definition of done

A skeptical judge can verify:

1. real autonomous workflow hits a meaningful boundary;
2. execution pauses;
3. AgentException exists;
4. ResolutionContract exists;
5. multiple resolution options exist;
6. at least one real/protocol-authentic Solana payment happens;
7. external result is independently validated;
8. failed result automatically causes escalation;
9. passing result produces ResolutionReceipt;
10. original agent resumes automatically only after receipt;
11. over-budget case abstains with $0 spent;
12. at least one real Pay.sh catalog capability is purchased;
13. benchmark runs reproducibly;
14. UI communicates the loop on mute.

## Approved clarification — September 30, 2026

Partial-evidence resolvers are eligible when they match at least one required evidence/check dimension, have validator-compatible output, materially advance resolution, and meet budget/deadline/network constraints. They need not satisfy the full SuccessContract alone. Only the independent validator determines full success; OCR may fail full validation before escalation.

A ResolutionReceipt and automatic resume require both actual SETTLED payment and PASS verification. Unpaid development runs may return internal VALIDATED_UNPAID only: no receipt, settlement event, or automatic resume. This internal state is not a new canonical event or ResolverAttempt terminal state.
