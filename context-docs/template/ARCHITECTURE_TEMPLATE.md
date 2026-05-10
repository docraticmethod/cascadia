
# ARCHITECTURE_TEMPLATE.md

describes what components exist and how they wire together (orchestrator, subagent, skills, eval, memory, etc.). 


## Architectural Instructions

Flat structure to start; promote to layered (routes / controllers / services) only when a second resource warrants it.


Plan first, in this order:
1. Confirm or adjust the architecture for this scenario.
2. Propose the exact output schema (JSON shape) for one case.
3. Identify the smallest first slice — orchestrator + 1 subagent + schema
   eval + 1 case end-to-end. Skip memory and retry until that runs.
4. List any new dependencies (likely just zod or ajv for schema validation).

Do not create files yet. Show me the plan.

Important notes:
- This is decision-support, not autonomous decision-making. Output must be
  reviewable, with reasoning visible.
- Schema rigor matters: need consistent output structure.
- Privacy: case data is synthetic dummy data. No real PII.

## Architecture for agentic harness


## orchestrator and subagent

1. orchestrator.js — reads data/cases.json, fans out one subagent per
 case via Promise.all, aggregates results, writes a report.

2. subagent.js — wraps Anthropic SDK. Per-case: takes a case, returns
   structured output. Tool-use loop with end_turn.

## skills

3. skills:

a) skills/primary.js — the (the domain skill — triage, scoring, classification, etc. capability as a data object: name, systemPrompt (guidance + output schema), tools (none initially),
   successCriteria (schema validation + sanity checks). 


b) skills/guardrail.js exporting two prompts (preflightSystemPrompt
and postflightSystemPrompt) plus successCriteria that validates the
JSON shape AND enforces the escalate-only invariant.
Per-case flow in the orchestrator (sequential within a case,
parallel across cases via Promise.all):
   preflight → (with flags) → postflight → escalation logic.

See the following context-doc template for detailed specification:

   - [`context-docs/template/GUARDRAIL_SPEC.md`](context-docs/template/GUARDRAIL_SPEC.md)  Reference System Instructions for Guardrails

c) skills/sequencer.js — a skill that takes the full array of
finalized case records and returns an ordered queue.

## eval

4. eval.js — gates: validateSchema (output matches the contract),
   sanityCheck (e.g., "now" cases have at least one Immediate action).
   Aggregate errors, no short-circuit.

## data storage 

5. memory.js — JSONL at traces/failures.jsonl. Records cases where eval
   failed; on retry, prior failure context informs the next attempt.

## log trace

6. logger.js — JSONL trace per run, traceId threaded through.

## application 

7. run.js — CLI agentic entry. node src/run.js [path/to/cases.json]

## web 

8. server.js - (Nodejs Express Web Dashboard Server / health test ) Entry point: `src/server.js` — creates and exports the Express app. The `import.meta.url === pathToFileURL(process.argv[1]).href` guard is the ESM equivalent of `require.main === module`; the HTTP server only starts when the file is run directly, not when imported in tests.




