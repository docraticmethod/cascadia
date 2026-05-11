# ARCHITECTURE.md

## Project type
Meta-tool. The Console is a workflow harness for building other projects. 

## Shape
Single-page web application backed by a thin Node.js + Express server. The server reads and writes four markdown files in the target project's `context-docs/workflow/` directory and proxies AI generation calls to the Anthropic API.

## Target resolution
The Console is portable. It does not own the workflow files it manages — they belong to whichever project the architect is building. The target is set in CONSOLE's `.env`:

TARGET_WORKFLOW=/absolute/path/to/<project>/context-docs/workflow
TARGET_TEMPLATE=/absolute/path/to/<project>/context-docs/template

The four workflow files (REQUIREMENTS.md, STRATEGY.md, ARCHITECTURE.md, SYSTEM_INSTRUCTIONS.md) live at `${TARGET_WORKFLOW}/`. Template files (ARCHITECTURE_TEMPLATE.md, GUARDRAIL_SPEC.md) resolve to `${TARGET_TEMPLATE}/` and are loaded into the prompt during ARCHITECTURE generation when present. Switching projects requires editing `.env` and restarting the server.

## Components

### Server (`src/server.js`)
- Express 5, ESM, Node 24
- Serves the static SPA from `public/`
- Routes:
  - `GET /health` — liveness
  - `GET /api/doc/:name` — return contents of REQUIREMENTS / STRATEGY / ARCHITECTURE / SYSTEM_INSTRUCTIONS
  - `PUT /api/doc/:name` — persist contents (full replace; Git owns history)
  - `POST /api/generate/:target` — trigger AI generation; returns generated content + inconsistency flags
  - `POST /api/fix/:target` — second-pass AI revision when architect clicks Fix on a flagged inconsistency
- Writes are restricted to the four allowed filenames within `TARGET_WORKFLOW`. Path traversal is rejected.
- `import.meta.url === pathToFileURL(process.argv[1]).href` guard so the server only listens when run directly, not when imported in tests

### Generation orchestrator (`src/generator.js`)
Per-target dispatch. Each generator receives `{ action, payload }`:

- `generate('strategy', ...)` — loads REQUIREMENTS.md, calls Anthropic, returns generated STRATEGY content
- `generate('architecture', ...)` — loads STRATEGY.md and all .md files present in ${TARGET_TEMPLATE} (template filenames are not hardcoded; the directory contents are the templates)
- `generate('system_instructions', ...)` — loads STRATEGY.md and ARCHITECTURE.md, calls Anthropic, returns generated SYSTEM_INSTRUCTIONS content

`action` is `'add'` or `'edit'`. The generator builds the prompt accordingly so the AI produces a delta vs a revision. Action propagates into the response so the UI knows whether the new entry is a fresh CLI input or a context-refresh signal.

### Inconsistency check (`src/consistency.js`)
Runs as a second AI call after each generation step (LLM-as-judge pattern). Re-reads the immediate upstream document alongside the newly generated downstream document and returns:

{
consistent: boolean,
flags: [{ severity, description, suggested_fix }]
}

The UI surfaces flags as red warnings with a Fix button. Clicking Fix triggers `POST /api/fix/:target`, which runs a second-pass generation incorporating the flags. Auto-fix is rejected to preserve architect agency.

Cost note: every Submit produces two Anthropic calls (generate + judge). Prototype usage is well within negligible cost.

### Anthropic client (`src/anthropic.js`)
- Wraps `@anthropic-ai/sdk`
- Single `generate({ system, user })` function; orchestrators build the prompts
- API key from `.env` via dotenv

### Document store (`src/docs.js`)
- Reads/writes the four workflow .md files under `TARGET_WORKFLOW`
- Resolves template files under `${TARGET_TEMPLATE}` for read-only loading
- Atomic writes (write to temp + rename) to avoid partial files on crash
- Rejects any path outside the allowed set

### SPA (`public/`)
- Vanilla HTML/CSS/JS — no build step, no framework. Proven approach from the triage demo.
- `public/index.html` — four-tab layout
- `public/app.js` — tab state, lock/unlock, ADD/EDIT buttons, Submit, spinner, redirect, inconsistency flag display, Fix button
- `public/styles.css`

## Data flow per Submit
1. Client PUTs the updated .md to the server.
2. Client POSTs `/api/generate/:next` with `{ action, payload }`.
3. Server loads upstream doc(s), calls Anthropic, then runs the consistency check as a second call.
4. Server returns `{ generated_content, flags }`.
5. Client displays generated content in the next tab. Inconsistency flags render as red warnings with Fix buttons.
6. If architect clicks Fix, client POSTs `/api/fix/:target`, server runs second-pass generation, returns revised content.

## State
- All persistent state is the four .md files on disk in the target project.
- Git (in the target project) is the version control layer; no draft files, no app-level history.
- No database.

## Configuration
CONSOLE `.env`:
- `ANTHROPIC_API_KEY` — checked at startup, never logged
- `PORT` — default 3000
- `ENVIRONMENT` — runtime label
- `TARGET_WORKFLOW` — absolute path to the target project's workflow directory
- `TARGET_TEMPLATE` — absolute path to the target project's template directory


## Tests
Deferred. CONSOLE's only verifiable behavior is plumbing (file read/write, API call returns, route shape). End-to-end correctness lives in the target project's tests and ultimately in whether Claude Code produces a working implementation from the generated SYSTEM_INSTRUCTIONS. Smoke tests may be added later if plumbing bugs become a problem.

## Out of scope (per STRATEGY)
- Auth (single-user local tool)
- Multi-architect collaboration
- Direct Claude Code CLI integration
- Project-content reasoning beyond the four documents and the two template files
- Auto-fix on inconsistency (Fix button only)
- In-app project switching (requires `.env` edit and restart)

