# Resolve — Architecture.md

**Objective:** minimum moving parts, maximum demo proof.

## 1. System

```text
OpenAI consumer agent
        │
        ▼
AgentException
        │
        ▼
ResolutionContract
        │
        ▼
ResolverPlanner ─── Resolver manifests/history
        │
        ▼
BudgetGuard
        │
        ▼
PaymentAdapter
        │
        ▼
Resolver
        │
        ▼
SuccessValidator
   ┌────┴────┐
 FAIL       PASS
   │          │
 next      ResolutionReceipt
 rung         │
              ▼
       original agent resumes
```

## 2. Locked stack

```text
TypeScript
Node.js + Express
Next.js + React + Tailwind
Zod
SQLite + better-sqlite3
OpenAI Agents JS
SSE
Vitest
npm
```

## 3. Payment architecture — adapter-first

Do not couple Resolve core to one protocol library.

```ts
interface PaymentAdapter {
  pay(input: {
    attemptId: string;
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: unknown;
    maxAmountUsd: number;
  }): Promise<{
    status: "SETTLED" | "FAILED";
    amountUsd?: number;
    transaction?: string;
    responseStatus?: number;
    responseBody?: unknown;
    rawReceipt?: unknown;
  }>;
}
```

### Adapter choice order today

#### A. PayKitAdapter — preferred if workshop/current docs compile immediately

Use current `@solana/pay-kit` TypeScript API to gate local Express routes and/or make payment-aware fetches. Force the x402 rail if the endpoint advertises multiple rails and the demo specifically needs x402.

Why: sponsor-native, current TypeScript server/client, fewer lines, Express integration.

#### B. PayCliAdapter — fastest external-provider path

Wrap the official open-source `pay` binary from Node using `child_process.spawn` with argument arrays, never shell-concatenated strings.

Use sandbox during development and `--no-dna` for machine-oriented output where appropriate.

Responsibilities:

- call exact catalog gateway URL;
- capture stdout/stderr;
- timeout;
- parse only documented/observed output;
- never invent transaction data if not emitted;
- map response to `PaymentAdapter` result.

This adapter is allowed even though the CLI implementation is Rust; it is an external tool, not project-owned application code.

#### C. X402FoundationAdapter — fallback

If Pay Kit/CLI cannot support the required in-app path quickly, use:

```text
@x402/core
@x402/svm
@x402/fetch
@x402/express
```

Do not keep multiple active payment implementations after one works.

## 4. Pay.sh provider discovery

Discovery is useful but must not become the product.

Represent catalog providers as Resolve manifests:

```ts
interface ResolverManifest {
  id: string;
  source: "LOCAL" | "PAY_SH";
  class: "VERIFIER" | "SPECIALIST" | "HUMAN";
  capabilities: string[];
  quotedPriceUsd: number;
  endpoint: string;
  expectedLatencyMs: number;
  outputSchema: string;
}
```

For P0, manifests may be **preloaded from verified Pay.sh catalog entries** rather than performing live search during every resolution.

Optional P1: use `pay skills search` / Pay MCP tools to show discovery.

This saves time and eliminates live-search failure while still using real external paid services.

## 5. P0 resolver topology

### PolicyVerifierResolver

Local deterministic resolver for hero commerce policy conflict.

Input:

```text
buyer offer
minimum price
privacy policy
```

Output:

```json
{
  "counter_offer": 900,
  "share_address": false,
  "message": "I can do $900. If that works, I can send a public pickup location."
}
```

Can be pay-gated locally if payment integration is already working; do not delay the core for this.

### AlibabaOcrResolver

Catalog source:

```text
solana-foundation/alibaba/ocr
https://ocr.alibaba.gateway-402.com
```

Purpose: cheap text evidence.

### GoogleVisionResolver

Catalog source:

```text
solana-foundation/google/vision
https://vision.google.gateway-402.com
```

Purpose: richer labels/logo/text/web/product evidence.

## 6. Escalation contract

For the image evidence demo:

```ts
const SuccessContract = {
  requiredEvidence: [
    "text_evidence",
    "logo_or_label_evidence",
    "product_or_web_entity_evidence"
  ]
};
```

Normalize provider-specific payloads into one internal result:

```ts
interface ImageEvidenceResult {
  textEvidence?: unknown[];
  logoOrLabelEvidence?: unknown[];
  productOrWebEntityEvidence?: unknown[];
  provider: string;
  raw?: unknown;
}
```

Alibaba OCR naturally lacks some rich evidence categories → `VALIDATION_FAIL`.
Google Vision can supply richer evidence → potential `PASS`.

The validator decides; provider HTTP 200 does not.

## 7. Repository structure

Keep the repo flatter than the old architecture unless code volume justifies packages.

```text
resolve/
├── apps/
│   ├── api/src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   └── sse.ts
│   └── web/
│       ├── app/demo/page.tsx
│       ├── app/benchmark/page.tsx
│       └── components/
├── packages/
│   ├── core/
│   │   ├── schemas.ts
│   │   ├── planner.ts
│   │   ├── budget.ts
│   │   ├── validator.ts
│   │   ├── receipt.ts
│   │   └── events.ts
│   ├── payments/
│   │   ├── types.ts
│   │   ├── payKitAdapter.ts      # only if selected
│   │   ├── payCliAdapter.ts      # only if selected
│   │   └── x402Adapter.ts        # fallback only
│   ├── resolvers/
│   │   ├── policyVerifier.ts
│   │   ├── alibabaOcr.ts
│   │   └── googleVision.ts
│   ├── agent-runtime/
│   │   ├── sellingAgent.ts
│   │   └── resume.ts
│   ├── persistence/
│   └── benchmark/
├── scripts/
│   ├── payment-smoke.ts
│   ├── demo-policy.ts
│   ├── demo-escalate.ts
│   ├── demo-abstain.ts
│   ├── demo-reset.ts
│   └── benchmark.ts
└── docs/
```

Do not create a separate microservice merely to host a specialist model if catalog resolvers work.

## 8. Core schemas

Define once with Zod and infer TypeScript types.

At minimum:

- `AgentExceptionSchema`
- `ResolutionContractSchema`
- `SuccessContractSchema`
- `ResolverManifestSchema`
- `ResolverResultSchema`
- `ResolutionReceiptSchema`
- `ResolveEventSchema`

Backend, UI, tests, and benchmark import the same types.

## 9. BudgetGuard

```ts
interface BudgetGuard {
  authorize(input: {
    contractId: string;
    resolverId: string;
    amountUsd: number;
    alreadySpentUsd: number;
    maxAttemptUsd: number;
    maxTotalUsd: number;
  }):
    | { allowed: true }
    | { allowed: false; reason: "MAX_ATTEMPT" | "MAX_TOTAL" | "UNSUPPORTED_PAYMENT" };
}
```

BudgetGuard runs before payment adapter invocation.

## 10. Planner

Eligibility:

```text
capability match
AND quotedPrice <= maxAttempt
AND projected total <= maxTotal
AND deadline compatible
AND output is structurally compatible with the validator and materially advances at least one required evidence/check dimension
```

Ordering:

```text
expectedResolutionCost = quotedPrice / estimatedSuccessRate
```

P0 can seed coarse priors:

```text
OCR for text extraction: high
OCR for logo/product evidence: low
Vision for rich image evidence: high
```

Then replace/adjust with observed history.

## 11. OpenAI Agents JS integration

Use the official interruption/run-state mechanism for the original consumer-agent action.

Concept:

```ts
let result = await run(agent, input);

if (result.interruptions?.length) {
  const exception = mapToAgentException(result.interruptions[0]);
  const receipt = await resolveException(exception);

  if (!receipt) return safeFallback(exception);

  const state = result.state;
  // Resume is gated here by receipt validation and contract match.
  state.approve(result.interruptions[0]);
  result = await run(agent, state);
}
```

Critical: the resumed action must consume the verified resolution result rather than blindly executing unsafe original arguments.

## 12. Event model / SSE

Emit canonical events to an in-memory event bus and SSE route.

Frontend reduces:

```text
ResolveEvent[] → DemoState → render
```

Fixture tapes and live SSE use identical event schema.

## 13. Frontend

Two routes:

```text
/demo
/benchmark
```

Core component:

```text
ExecutionPath
```

States:

```text
RUNNING
PAUSED
RESOLVING
VERIFIED
RESUMED
ABSTAINED
```

Visual flow:

```text
execution ─────╳
               │ exception
               ▼
         ResolutionContract
          /       |       \
       OCR      Vision    Human
        ✕          ✓
                   │
              receipt
                   │
execution ─────────┴────────→ resumed
```

The `ResolutionStitch` only activates after receipt issuance.

## 14. Persistence

SQLite tables only if needed for benchmark/history:

- `resolver_attempts`
- `resolution_receipts`
- `resolver_stats`

Exceptions/contracts can remain in-memory for P0 if persistence is slowing the build. SQLite is P1 unless a benchmark/history feature requires it.

## 15. Demo modes

### LIVE

Real provider calls + real payment path.

### DETERMINISTIC_DEMO

Real Resolve orchestration, deterministic provider payload fixtures, preferably real payment path if stable.

### BENCHMARK

No external network dependency; deterministic fixtures.

## 16. Failure semantics

```text
PASS
VALIDATION_FAIL
PAYMENT_FAIL
TIMEOUT
MALFORMED
BUDGET_DENIED
```

Only PASS yields receipt.

Paid-but-invalid result remains a paid failed attempt and can trigger escalation.

## 17. Performance target

The hero policy loop should finish in ~20–35 seconds including narration.
The escalation demo should communicate failure→second purchase→pass in ~20 seconds.

These are presentation targets, not SLAs.

## Approved clarification — September 30, 2026

Partial-evidence resolvers are eligible when they match at least one required evidence/check dimension, have validator-compatible output, materially advance resolution, and meet budget/deadline/network constraints. They need not satisfy the full SuccessContract alone. Only the independent validator determines full success; OCR may fail full validation before escalation.

A ResolutionReceipt and automatic resume require both actual SETTLED payment and PASS verification. Unpaid development runs may return internal VALIDATED_UNPAID only: no receipt, settlement event, or automatic resume. This internal state is not a new canonical event or ResolverAttempt terminal state.
