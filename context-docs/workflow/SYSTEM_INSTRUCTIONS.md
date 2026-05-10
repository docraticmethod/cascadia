# SYSTEM_INSTRUCTIONS.md

## Project context
Build the CONSOLE — a portable, single-user web application that operationalizes a four-stage recompilable cascade workflow (REQUIREMENTS → STRATEGY → ARCHITECTURE → SYSTEM_INSTRUCTIONS). The Console reads and writes four markdown files in a target project's directory, orchestrates AI generation between layers, and surfaces inconsistency warnings.

Read REQUIREMENTS.md, STRATEGY.md, and ARCHITECTURE.md in `context-docs/workflow/` before starting. They are the authoritative spec.

## Build order

### Slice 1 — Server skeleton + health
1. Test `src/server.js`: Express 5 app, ESM, dotenv, listen on `process.env.PORT || 3000`.
2. Implement `GET /health` returning `{ status: 'ok', uptime, version }`.
3. Add the `import.meta.url === pathToFileURL(process.argv[1]).href` guard.
4. Verify with `curl -s http://localhost:3000/health`.

### Slice 2 — Document store
1. Create `src/docs.js`.
2. Resolve `TARGET_WORKFLOW` from env at startup; fail fast if unset or unreadable.
3. Implement `readDoc(name)` and `writeDoc(name, content)` for the four allowed filenames: REQUIREMENTS.md, STRATEGY.md, ARCHITECTURE.md, SYSTEM_INSTRUCTIONS.md. Reject any other name.
4. Writes are atomic: write to `<name>.tmp`, then rename.
5. Add a `readTemplate(name)` for ARCHITECTURE_TEMPLATE.md and GUARDRAIL_SPEC.md, resolving to `${TARGET_WORKFLOW}/../template/`. Return `null` if missing — templates are optional per project.

### Slice 3 — Document routes
1. Add `GET /api/doc/:name` and `PUT /api/doc/:name` to server.js. Wire to docs.js.
2. Validate `:name` against the allowed set; return 400 on mismatch.
3. PUT body is the raw markdown string (Content-Type: text/plain or application/json with a `content` field — your call, document the choice).

### Slice 4 — Anthropic client
1. Create `src/anthropic.js`. Wrap `@anthropic-ai/sdk`.
2. Read `ANTHROPIC_API_KEY` from env; fail fast if absent. Never log the key.
3. Export a single `generate({ system, user })` function returning the response text.
4. Read Read `ANTHROPIC_MODEL` from env; this is used for generative API calls; fail fast if absent.

### Slice 5 — Generation orchestrator
1. Create `src/generator.js`.
2. Implement three generators: `generateStrategy`, `generateArchitecture`, `generateSystemInstructions`.
3. Each takes `{ action, payload }` where action is `'add'` or `'edit'` and payload is the upstream change.
4. Each loads the upstream document(s) from `docs.js`, builds the system + user prompt, calls `anthropic.generate`, returns the generated content.
5. `generateArchitecture` additionally loads ARCHITECTURE_TEMPLATE.md and GUARDRAIL_SPEC.md if present and includes them as context.
6. Prompts must explicitly state ADD vs EDIT semantics so the AI returns a delta or a revision accordingly.

### Slice 6 — Inconsistency check
1. Create `src/consistency.js`.
2. Implement `check({ upstream, downstream, layer })` — calls Anthropic with an LLM-as-judge prompt that re-reads upstream and downstream and returns `{ consistent: boolean, flags: [...] }`.
3. Each flag has `{ severity, description, suggested_fix }`.

### Slice 7 — Generation route
1. Add `POST /api/generate/:target` to server.js. Targets: `strategy`, `architecture`, `system_instructions`.
2. Body: `{ action, payload }`.
3. Dispatch to the appropriate generator, then run the consistency check, then return `{ generated_content, flags }`.

### Slice 8 — Fix route
1. Add `POST /api/fix/:target`. Body: `{ flags, current_content }`.
2. Calls Anthropic with a revision prompt incorporating the flags.
3. Returns the revised content. The architect chooses whether to persist via PUT.

### Slice 9 — SPA shell
1. Create `public/index.html`, `public/app.js`, `public/styles.css`. Vanilla — no framework, no build step.
2. Four tabs: Requirements, Strategy, Architecture, System Instructions. Always navigable; tab content is read-only by default.
3. Each tab fetches its document via `GET /api/doc/:name` on activation.
4. Empty documents render as a placeholder; EDIT button is disabled when empty.

### Slice 10 — Lock/Unlock + ADD/EDIT
1. Per tab: an Unlock checkbox enables ADD and EDIT buttons.
2. ADD opens an empty textfield; EDIT opens a textfield prefilled with the current document.
3. After ADD or EDIT click, the checkbox label flips to "Lock" and Submit is disabled until Lock is clicked.
4. Locking makes the textfield read-only and enables Submit.

### Slice 11 — Submit + cascade
1. On Submit: client PUTs the updated document, then POSTs to `/api/generate/:next` with `{ action, payload }`.
2. Show a spinner with "AI GENERATING <NEXT>" until the response returns.
3. On response: write the generated content to the next document via PUT, redirect to that tab, render the new content.
4. Render any inconsistency flags as red warnings above the document, each with a Fix button.

### Slice 12 — Fix flow
1. Clicking Fix POSTs to `/api/fix/:target` with the current document and the flags.
2. Spinner during the call.
3. On response: replace the document content with the revised version. Architect can review and Lock/Submit again to persist.

## Conventions
- ESM throughout; `.js` extensions on local imports
- No comments unless the why is non-obvious
- Conventional commits, small focused diffs
- Tests deferred per ARCHITECTURE.md — smoke-test plumbing only if you encounter bugs

## Constraints
- Single-user, localhost only. No auth.
- Path traversal rejected; only the four workflow filenames + two template filenames are accessible.
- Atomic writes only.
- Never log the Anthropic API key.

## Plan first
Before creating files, output a plan: file list, route list, dependency list, the smallest first slice you'd verify end-to-end. Wait for confirmation before starting.


## Footnote / flags

One — I split the build into 12 slices. ARCHITECTURE specified roughly the same components but didn't pin a build order. The order above goes plumbing-first, UI-last, which matches my methodology (UI built last because the data layer is already correct).


Two — the PUT body format is left to Claude Code's judgment ("your call, document the choice"). Recommend application/json with a content field for forward compatibility.

Three — Claude Code outputs a plan before files; I then approve. 