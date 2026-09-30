# Resolve — REFERENCE_REPOS.md

**Rule:** reuse commodity infrastructure aggressively; keep Resolve's differentiated runtime original.

## 1. Solana Foundation `pay` — PRIMARY HACKATHON TOOL

Repository:

```text
https://github.com/solana-foundation/pay
```

Role:

- official Pay.sh CLI;
- x402 + MPP challenge handling;
- sandbox wallet/network;
- debugger;
- provider discovery via Pay skills/MCP;
- wrapping Claude/Codex/curl;
- payment permissions.

Use immediately:

```bash
brew install pay
pay --version
pay --sandbox curl https://debugger.pay.sh/mpp/quote/AAPL
pay skills search "vision image"
```

For machine-oriented shell usage, current docs support `--no-dna`/non-TTY JSON-oriented behavior.

Do not copy the Rust CLI code into Resolve.

## 2. Solana Foundation `pay-kit` — PREFERRED TS PAYMENT SDK IF CURRENT EXAMPLE WORKS

Repository:

```text
https://github.com/solana-foundation/pay-kit
```

Docs:

```text
https://pay.sh/docs/sdk/typescript
```

Role:

- TypeScript payment gates/client;
- Express middleware;
- Solana payment sandbox;
- x402 and MPP abstraction in current docs.

Current documented shape includes:

```ts
import { createPayKit, usd } from '@solana/pay-kit';

const pay = await createPayKit({
  accept: ['x402'],
  // network/operator/pricing...
});

app.get('/resource', pay.express('gate'), handler);
```

and payment-aware client fetch.

Important:

- follow the workshop/current docs exactly because this repo is moving quickly;
- verify actual installed package API before writing wrappers;
- if TypeScript x402 path blocks for >10 minutes, switch rather than debugging internals.

## 3. Pay.sh `pay-skills` — USE EXISTING RESOLVERS

Repository:

```text
https://github.com/solana-foundation/pay-skills
```

Role:

- open catalog of paid agent APIs;
- provider metadata and OpenAPI shapes;
- exact gateway URLs/pricing/capabilities.

### P0 provider: Alibaba OCR

```text
FQN: solana-foundation/alibaba/ocr
service: https://ocr.alibaba.gateway-402.com
catalog price observed: ~$0.001/request
```

Use for cheap image text extraction.

### P0 provider: Google Vision

```text
FQN: solana-foundation/google/vision
service: https://vision.google.gateway-402.com
catalog price observed: ~$0.0015/request
```

Use for richer image evidence: labels, logos, OCR/text, web entities, object/product-style signals depending on request features.

### Why these two

They create a natural real escalation:

```text
cheap OCR
→ text only
→ contract requires richer evidence
→ FAIL
→ Google Vision
→ richer evidence
→ PASS
```

No custom specialist service needed.

## 4. x402 Foundation — FALLBACK/DIRECT PROTOCOL

Repository:

```text
https://github.com/x402-foundation/x402
```

Use only if Pay Kit/Pay CLI cannot support the required in-app path fast enough.

Relevant packages:

```text
@x402/core
@x402/svm
@x402/fetch
@x402/express
```

Use official examples for V2 402→signature→retry→response.

Never invent headers from memory.

## 5. OpenAI Agents JS — USE DIRECTLY

Repository:

```text
https://github.com/openai/openai-agents-js
```

Use official HITL/interruption examples for:

- run interruption;
- serialized/current run state;
- approval/rejection mechanics;
- resuming the same run.

Resolve-specific invariant:

```text
SDK interruption != AgentException
SDK approval != ResolutionReceipt
```

Resume only after matching verified receipt.

## 6. x402 Model Gateway — FALLBACK PATTERN ONLY

Repository:

```text
https://github.com/suhaasgaddala/x402-model-gateway
```

Useful patterns:

- Express paid endpoint structure;
- Zod input validation;
- provider adapter;
- deterministic mock provider;
- tests;
- `.env.example`.

Do not build this service if Pay.sh catalog providers work.

Its payment wiring is Base/EVM-oriented and must not be copied into the Solana path.

## 7. Cloudflare x402 example — REFERENCE ONLY

Repository area:

```text
https://github.com/cloudflare/agents/tree/main/examples/x402
```

Learn only:

- payment-aware fetch ergonomics;
- minimal protected route mental model.

Do not adopt Hono, Base, or its frontend architecture.

## 8. Skeleton Key — DEMO PROOF INSPIRATION ONLY

Repository:

```text
https://github.com/Carldtitan/skeleton_key
```

Borrow only these presentation lessons:

- instant before/after;
- hard numbers near top;
- a watchable race instead of only claims;
- a tangible artifact;
- transparent evaluation.

Resolve equivalent:

```text
before: agent blocked/unsafe
mechanism: paid verified resolution
artifact: ResolutionReceipt
after: same workflow resumes
proof: strategy race + cost per verified resolution
```

Do not copy Skeleton Key's browser/API-generation architecture or UI.

## 9. Resolve-owned logic — NEVER outsource

- `AgentException`
- `ResolutionContract`
- `SuccessContract`
- `BudgetGuard`
- capability/budget/deadline eligibility
- expected-cost resolver ordering
- independent validator
- automatic escalation
- `ResolutionReceipt`
- no-receipt-no-resume invariant
- benchmark strategies and metrics
- broken-execution/resolution-stitch visual metaphor

## 10. Reuse decision tree

Before writing code:

```text
Is it a payment primitive?
→ use Pay/Pay Kit or x402 Foundation.

Is it an agent interruption primitive?
→ use OpenAI Agents JS.

Is it a specialist capability already in pay-skills?
→ buy it; do not rebuild it.

Is it Resolve's differentiated logic?
→ implement locally from these docs.
```
