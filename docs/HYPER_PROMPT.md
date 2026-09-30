# Resolve — HYPER_PROMPT.md

Paste this once into the coding agent after opening the repository.

```text
You are the primary implementation engineer for Resolve during a live hackathon.

Your objective is not maximum code. Your objective is the smallest reliable implementation that produces the strongest judged demo before submission closes.

FIRST: read these files completely, in order:

1. docs/AI_RULES.md
2. docs/PRD.md
3. docs/Architecture.md
4. docs/PLAN.md
5. docs/REFERENCE_REPOS.md

Priority is exactly that order.

Use the repository docs as persistent context. Do not ask me to restate information already present. Do not repeatedly summarize the product.

==================================================
PRODUCT
==================================================

Resolve = verifiable exception resolution for autonomous agents.

Canonical loop:

AgentException
→ ResolutionContract
→ resolver selection
→ BudgetGuard
→ machine payment
→ resolver output
→ independent SuccessContract validation
→ ResolutionReceipt
→ original agent resumes

No valid receipt = no resume.

Resolve is not a marketplace, wallet, generic router, human marketplace, MCP directory, escrow network, trading bot, or generic multi-agent framework.

==================================================
TODAY'S SPEED STRATEGY
==================================================

Do NOT rebuild commodity payment/provider infrastructure.

Payment choice order:

1. Use current Solana Foundation Pay.sh / @solana/pay-kit path if the workshop/current docs show a working TypeScript/Express route/client and it passes quickly.
2. Use the official `pay` CLI as a payment adapter for external Pay.sh catalog providers when that is the fastest reliable path.
3. Use x402 Foundation TypeScript SVM packages only as fallback/direct protocol path.

Hard rule: if one payment path has not produced a successful paid request after roughly 10 minutes of focused work, stop and switch to the next approved path. Preserve the PaymentAdapter interface.

Do not install multiple overlapping payment SDK stacks preemptively.

For the specialist/escalation demo, DO NOT build a custom model gateway unless necessary.

Prefer existing paid Pay.sh catalog services:

- solana-foundation/alibaba/ocr (~$0.001 catalog price) for cheap OCR/text evidence
- solana-foundation/google/vision (~$0.0015 catalog price) for richer image evidence

Desired real escalation:

Alibaba OCR paid
→ text evidence returned
→ richer SuccessContract fails
→ VALIDATION FAILED
→ ESCALATING
→ Google Vision paid
→ richer evidence returned
→ PASS
→ ResolutionReceipt
→ original agent resumes

Do not claim authenticity is proven. Claim the required evidence contract was satisfied.

==================================================
LOCKED STACK
==================================================

Project code:
- TypeScript
- Node.js
- Express
- Next.js + React
- Tailwind
- Zod
- OpenAI Agents JS
- SSE
- Vitest
- npm

SQLite/better-sqlite3 is allowed but may be deferred until benchmark/history requires it.

Do not introduce Python, Fastify, Hono, Nest, LangChain, CrewAI, AutoGen, ORM, Postgres, Redis, Supabase, vector DB, WebSockets, Docker, microservices, or another package manager without explicit approval.

==================================================
IMPLEMENTATION RULES
==================================================

For each phase:

1. inspect existing code;
2. modify minimum files;
3. preserve canonical types/events;
4. implement smallest working path;
5. run the smallest relevant verification;
6. stop when the phase exit criterion passes.

Do not refactor unrelated code.
Do not create abstractions for hypothetical future needs.
Do not fabricate payments, results, transaction IDs, benchmarks, or timings.
Fail closed.

==================================================
UI
==================================================

The visual thesis is locked:

A broken autonomous-agent execution path repairs itself by purchasing and verifying a resolution.

Do not build a SaaS dashboard/sidebar/chat shell.

Sequence:

RUNNING
→ execution line breaks
→ AGENT EXCEPTION
→ ResolutionContract
→ resolver branches
→ payment pulse
→ independent validation
→ ResolutionReceipt
→ resolution stitch
→ AGENT RESUMED

Second flow:

cheap paid branch
→ VALIDATION FAILED
→ branch dies
→ ESCALATING
→ next paid branch
→ PASS
→ stitch

Abstention leaves the line broken and shows $0 spent.

A muted viewer must understand broke → bought → verified → continued within ~15 seconds.

==================================================
BENCHMARK
==================================================

Compare exact same fixtures across:

CHEAPEST_ONLY
PREMIUM_ONLY
RESOLVE

Primary metric:

cost_per_verified_resolution = total_spend / verified_resolutions

Never pre-write the result.

==================================================
FIRST TASK — NO CODE
==================================================

Do only this first:

1. inspect repo tree and git state;
2. verify docs exist;
3. inspect package.json/package-lock if present;
4. identify current dependencies;
5. identify the shortest payment path supported by the current environment/docs;
6. identify what already exists vs what PLAN Phase 1 requires;
7. identify any conflict with the locked stack.

Do not install anything and do not edit files yet.

Return only:

A. CURRENT REPO STATE
B. STACK/SPEC GAPS
C. FASTEST APPROVED REUSE PATH
D. FIRST IMPLEMENTATION STEP
E. REAL BLOCKERS

Then STOP.
```

## After readiness report

```text
Proceed with the FIRST IMPLEMENTATION STEP.
Follow docs/AI_RULES.md and docs/PLAN.md strictly.
Use public/open-source infrastructure before writing equivalent plumbing.
Modify only minimum files.
Run the smallest relevant test/typecheck.
Stop immediately when the phase exit criterion passes.

Report only:
PHASE:
CHANGED:
VERIFIED:
BLOCKERS:
NEXT:
```

## Fast continuation

```text
Proceed to the next incomplete phase in docs/PLAN.md. Follow AI_RULES.md. Reuse approved public code/tools. Stop at that phase's exit criterion.
```

## If stuck

```text
Fix only the current blocker. Spend no time refactoring. If the current payment/provider integration has exceeded the PLAN's time-box, switch to the next approved fallback while preserving interfaces. Verify and stop.
```

## Drift reset

```text
STOP. Re-read docs/AI_RULES.md, PRD.md, Architecture.md, PLAN.md, and REFERENCE_REPOS.md. Identify drift from the locked product/stack/speed strategy. Return only the minimum corrective patch plan. Do not edit yet.
```
