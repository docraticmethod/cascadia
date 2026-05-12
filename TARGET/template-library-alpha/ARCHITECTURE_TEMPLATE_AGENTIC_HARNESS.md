# ARCHITECTURE_TEMPLATE_AGENTIC_HARNESS.md

Describes what components exist and how they wire together (orchestrator, subagent, skills, eval, memory, etc.).

## Architectural Instructions

Flat structure to start; promote to layered (routes / controllers / services) only when a second resource warrants it.

Plan first, in this order:

1. Confirm or adjust the architecture for this scenario.
2. Propose the exact output schema (JSON shape) for one use-case actor, object, or case.
3. Identify the smallest first slice — orchestrator + 1 subagent + schema eval + 1 case end-to-end. Skip memory and retry until that runs.
4. List any new dependencies (likely just zod or ajv for schema validation).


Important notes:

- Input data lives in `/data/`. Filename reflects the case shape — e.g.,
  `data/<customers>.json`, `data/<customer_invoices>.json`, `data/<patients>.json`.
- Input data is synthetic dummy data for the prototype — invented accounts,
  invoices, payment histories, order activity, or whatever the use-case
  requires. No real PII.
- Output must be reviewable, with reasoning visible.
- Schema rigor matters: need consistent output structure.

## Architecture for agentic harness

### Orchestrator and subagent

1. **orchestrator.js** — reads `data/<actors-objects-cases>.json`, fans out one subagent per use-case Actor, Object, or Case (depending on use-case context) via `Promise.all`, aggregates results, writes a report.
2. **subagent.js** — wraps Anthropic SDK. Per-actor/object/case: takes a use-case actor/object/case, returns structured output. Tool-use loop with `end_turn`.

### Skills

3. Skills:

   a) **skills/primary.js** — the domain skill (processing, triage, scoring, classification, etc.) capability as a data object: `name`, `systemPrompt` (guidance + output schema), `tools` (none initially), `successCriteria` (schema validation + sanity checks).

   b) **skills/guardrail.js** — exports two prompts (`preflightSystemPrompt` and `postflightSystemPrompt`) plus `successCriteria` that validates the JSON shape AND enforces the escalate-only invariant.

   Per-actor/object/case flow in the orchestrator (sequential within an actor/object/case, parallel across cases via `Promise.all`): preflight → (with flags) → postflight → escalation logic.

   If available and provided in templates, see the following context-doc template for detailed guardrail specification:
   - [`context-docs/template/GUARDRAIL_SPEC.md`](context-docs/template/GUARDRAIL_SPEC.md) — Reference System Instructions for Guardrails

   c) **skills/sequencer.js** — if relevant, a skill that takes the full array of finalized actor/object/case records and returns an ordered queue. Skip if not in requirements.

### Eval

4. **eval.js** — gates: `validateSchema` (output matches the contract), `sanityCheck` (e.g., "now" actions/objects/cases have at least one Immediate action). Aggregate errors, no short-circuit.

### Data storage

5. **memory.js** — JSONL at `traces/failures.jsonl`. Records actors/objects/cases where eval failed; on retry, prior failure context informs the next attempt.

### Log trace

6. **logger.js** — JSONL trace per run, `traceId` threaded through.

### Application

7. **run.js** — CLI agentic entry. `node src/run.js [data/<actors-objects-cases>.json]`

### Web

8. **server.js** — Node.js Express web dashboard server / health test. Entry point: `src/server.js` creates and exports the Express app. The `import.meta.url === pathToFileURL(process.argv[1]).href` guard is the ESM equivalent of `require.main === module`; the HTTP server only starts when the file is run directly, not when imported in tests.