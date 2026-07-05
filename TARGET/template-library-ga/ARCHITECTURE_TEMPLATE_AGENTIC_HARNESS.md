# ARCHITECTURE_TEMPLATE_AGENTIC_HARNESS.md

Describes what components exist and how they wire together (orchestrator, subagent, skills, eval, memory, etc.).

## Architectural Instructions

Flat structure to start; promote to layered (routes / controllers / services) only when a second resource warrants it.

Plan first, in this order:

1. Confirm or adjust the architecture for this scenario.
2. Propose the exact output schema (JSON shape) for one use-case actor, object, or case. Estimate total model calls across the full fixture set. For nested data, multiply through every level (e.g., customers × invoices × calls/invoice).
3. Identify the smallest first slice — orchestrator + 1 subagent + schema eval + 1 case end-to-end. Skip memory and retry until that runs.
4. List any new dependencies (likely just zod or ajv for schema validation).
5. Stage gates govern build order:
   - **Slice 0 — INPUT gate.** `data/<cases>.json` exists and validates against the input schema before any application component is written.
   - **OUTPUT gate.** `public/output_data.json` is written by the pipeline and validates against the output schema before the dashboard slice begins.
   - Dashboard is the final build phase. It renders finalized output; it does not assemble data.

Do not create files yet. Show me the plan.

Important notes:

- Input data lives in `/data/`. Filename reflects the case shape — e.g., `data/<customers>.json`, `data/<customer_invoices>.json`, `data/<patients>.json`.
- Input data is synthetic dummy data for the prototype — invented patient data, accounts, invoices, payment histories, order activity, or whatever the use-case requires. No real PII.
- Test-data sizing budget: total model calls across the fixture set must keep runtime under ~5 min and burst under the rate ceiling. For nested data, multiply through every level. REQUIREMENTS.md declares the cap; architecture flags if exceeded.
- Output must be reviewable, with reasoning visible.
- Schema rigor matters: need consistent output structure.

## Pipeline shape

Three stages with file-based handoffs. Stage boundaries are files, not live connections.

**INPUT** — versioned fixture at `data/<cases>.json`. Built and validated before any application component is written. Read by the pipeline; never modified during a run.

**PIPELINE** — `run.js` + orchestrator + subagents + skills + eval. Reads INPUT, produces OUTPUT. All model calls, retries, scoring, sequencing, and aggregation happen here. The pipeline writes to OUTPUT exactly once per run, after eval gates pass.

**OUTPUT** — single validated artifact at `public/output_data.json` (or equivalent). Written by `run.js` after eval gates pass; never modified after write. The dashboard reads this file via the dashboard server.

The pipeline writes; the server serves; the client reads. No data flow between stages at render time. No interpretation of stage-to-stage handoff as "via API" is admissible.

## Architecture for agentic harness

### Orchestrator and subagent

1. **orchestrator.js** — reads `data/<actors-objects-cases>.json`, fans out one subagent per use-case Actor, Object, or Case (depending on use-case context) via `Promise.all`, aggregates results, writes a report. When a downstream skill (sequencer, aggregator) requires fields not present in finalized per-case records, the orchestrator enriches at call time by merging from original payloads. Per-case output contract remains untouched.
2. **subagent.js** — wraps Anthropic SDK. Per-actor/object/case: takes a use-case actor/object/case, returns structured output. Tool-use loop with `end_turn`. Anthropic client initialized with maxRetries: 3 by default.

### Skills

3. Skills:

**Skill contract** — Every file in skills/ must export exactly four things: name (string), systemPrompt (string), tools (array, possibly empty), successCriteria (object with a validate function).

   a) **skills/primary.js** — the domain skill (processing, triage, scoring, classification, etc.) capability as a data object: `name`, `systemPrompt` (guidance + output schema), `tools` (none initially), `successCriteria` (schema validation + sanity checks).

   b) **skills/guardrail.js** — exports two prompts (`preflightSystemPrompt` and `postflightSystemPrompt`) plus `successCriteria` that validates the JSON shape AND enforces the escalate-only invariant.

   Per-actor/object/case flow in the orchestrator (sequential within an actor/object/case, parallel across cases via `Promise.all`): preflight → (with flags) → postflight → escalation logic.

   If available and provided in templates, see the following context-doc template for detailed guardrail specification:
   - [`context-docs/template/GUARDRAIL_SPEC.md`](context-docs/template/GUARDRAIL_SPEC.md) — Reference System Instructions for Guardrails

   c) **skills/sequencer.js** — a skill that takes the full array of finalized actor/object/case records and returns an ordered queue. Required when the domain verb implies ordering (triage, prioritize, rank, route, match, queue). Omit only when no such verb is present.

### Eval

4. **eval.js** — gates: `validateSchema` (output matches the contract), `sanityCheck` (e.g., "now" actions/objects/cases have at least one Immediate action). Aggregate errors, no short-circuit.

### Data storage

5. **memory.js** — JSONL at `traces/failures.jsonl`. Records actors/objects/cases where eval failed; on retry, prior failure context informs the next attempt.

### Log trace

6. **logger.js** — JSONL trace per run, `traceId` threaded through.

### Application

7. **run.js** — CLI agentic entry. `node src/run.js [data/<actors-objects-cases>.json]`. On a clean run, writes the OUTPUT artifact and exits.

## Dashboard architecture

The dashboard is four files with explicit responsibilities. The server validates the OUTPUT artifact at startup; if validation fails, the dashboard does not start. No partial-success state where some endpoints work and others don't.

8. **dash-app-server.js** — Node/Express. Reads `public/output_data.json`, validates it against the output schema, exposes API endpoints to the client. The only component that touches the data file. ESM main-module guard (`import.meta.url === pathToFileURL(process.argv[1]).href`) so the HTTP server only starts when run directly, not when imported in tests.

9. **dash-app-client.js** — consumes the server's API endpoints. Never reads the data file directly. Holds all rendering, selection, expansion, and scroll logic.

10. **dash-app.html** — markup only. No inline styles. No inline scripts beyond loading the client module.

11. **dash-app.css** — external stylesheet. No styling lives in HTML or JS.

## Dashboard layout invariants

- Panel structure: default two-panel.
- Left panel lists cases-objects-actors in sequencer order, top to bottom, selectable. Top item selected by default on load.
- Right panel displays data sub-sections for each case-object-actor.
- Default expansion: all sub-sections in right panel load in collapsed state.
- Independent scroll: all panels.
- Collapsed minimum height: fixed minimum height sufficient to show the section label.