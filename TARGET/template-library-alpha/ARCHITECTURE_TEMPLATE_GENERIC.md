# ARCHITECTURE_TEMPLATE_GENERIC.md


## Architectural Instructions

Flat structure to start; promote to layered (routes / controllers / services) only when a second resource warrants it.

Plan first, in this order:

1. Confirm or adjust the architecture for this scenario.
2. Propose the exact data contracts at each boundary — input schema, intermediate shape (if any), output schema.
3. Identify the smallest first slice — one input → one process step → one output, end-to-end. Skip storage, observability, and dashboard until that runs.
4. List any new dependencies (likely a schema validator such as zod or ajv).

Do not create files yet. Show me the plan.

Important notes:

- Output must be reviewable, with reasoning visible wherever the process makes a judgment call.
- Schema rigor matters: contracts at every boundary.
- Privacy: input data is synthetic dummy data unless stated otherwise. No real PII.

## Architecture

### Inputs

1. **inputs.js** — reads from configured sources (file, API, queue, user upload). Validates against the input schema. Emits typed records to the process layer. Reads from `data/<input-set>.json` or equivalent; path is the CLI argument.

### Process

2. **process.js** — accepts validated input records, applies the system's core logic, emits output records. Pick the shape that matches requirements and document the choice:
   - **Pipeline** — linear: step1 → step2 → step3.
   - **Fan-out** — parallel processing per record via `Promise.all`, then aggregation.
   - **Single transform** — input in, output out, no intermediate state.
3. **process/steps/** — if the process is multi-step, one file per step. Each step is pure where possible: takes a record, returns a record, no hidden state.

### Outputs

4. **outputs.js** — writes output records to their destinations: files, database, API responses, dashboard feed. One destination per output type; multiplex if needed. Output schema is validated before write.

### Storage

5. **storage/** — JSONL or flat files to start; promote to SQLite or a database only when query needs warrant it.
   - `data/inputs/` — raw input cache
   - `data/outputs/` — final artifacts
   - `data/state/` — intermediate state if the process is non-trivial

### Observability

6. **logger.js** — JSONL trace per run, `runId` threaded through. Records: input received (schema-validated), process steps executed (with timing), outputs emitted, errors and warnings.
7. **eval.js** — gates: `validateSchema` (outputs match the contract), `sanityCheck` (aggregate properties hold — e.g., counts, distributions, invariants). Aggregate errors, no short-circuit.

### Entry points

8. **run.js** — CLI entry. `node src/run.js [data/<input-set>.json]`
9. **server.js** — Node.js Express web server; entry point for the dashboard and any HTTP-triggered runs. Entry point: `src/server.js` creates and exports the Express app. The `import.meta.url === pathToFileURL(process.argv[1]).href` guard is the ESM equivalent of `require.main === module`; the HTTP server only starts when the file is run directly, not when imported in tests.

### Dashboard UI

10. **public/** (vanilla) or **client/** (framework) — web interface for viewing inputs, monitoring runs, and reviewing outputs. Typical views:
    - **Inputs** — what's queued, what's been processed.
    - **Runs** — live trace, completed runs, drill-down to per-record detail.
    - **Outputs** — artifacts produced, with links to source inputs and process trace.
    - **Trigger** (optional) — manual run initiation, parameter input.

   API surface served by `server.js`:
   - `GET /api/inputs` — list and detail
   - `GET /api/runs` — list, status, trace
   - `GET /api/outputs` — list and detail
   - `POST /api/run` — trigger a run (optional)

## Guardrails (optional)

If the process makes consequential judgment calls (reg-tech, healthtech, fintech, legaltech, or similar domains where conservative bias is required), wrap the process layer with the two-pass guardrail pattern. See:

- [`context-docs/template/GUARDRAIL_SPEC.md`](context-docs/template/GUARDRAIL_SPEC.md) — Reference System Instructions for Guardrails