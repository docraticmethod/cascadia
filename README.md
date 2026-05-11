# Cascadia Console

**Author:** Blake Rogers
**Email:** saltyfog@gmail.com
**LinkedIn:** https://www.linkedin.com/in/blakerogerz/

> *A recompilable cascade for AI-assisted software development.*

Cascadia is a generative IDE for software specifications. Where classic RAD tools like Delphi or PowerBuilder generated code from declarative input (form designers, data bindings), Cascadia generates specifications from declarative input (plain-English requirements). Code is downstream — produced by Claude Code from the cascade's terminal layer. The recompilable cascade is the RAD output stack; the coding agent is the compiler.

Most engineers using Claude Code, Cursor, or Copilot collapse architect, translator, and coder into a single chat. The result is software that produces a binary the organization cannot maintain — opaque code, lost decisions, and rebuilding cost equal to building from scratch.

Cascadia enforces a different shape. Four plain-English documents form a layered stack — REQUIREMENTS → STRATEGY → ARCHITECTURE → SYSTEM_INSTRUCTIONS — where each layer is independently editable and regenerable from the layer above it. The architect remains the human in the loop; the AI does translation work between layers; Claude Code receives a fully resolved spec instead of a half-baked prompt.

The methodology is described in detail in [*AI-Generated Software Should Be Recompilable*](link-to-article-if-published).

## What it does

- Presents four tabs — one per cascade layer — each rendering the canonical markdown document for the target project.
- On Submit, generates the next layer's document via the Anthropic API, using the upstream document as context.
- Runs an LLM-as-judge consistency check on every generation, surfacing inconsistencies between the generated layer and its upstream source as warnings the architect can review and fix in a second pass. The check catches both defects in the AI's translation and defects in the architect's upstream document — a quality gate on both halves of the cascade.
- Distinguishes ADD (append new section) from EDIT (revise existing content) so deltas flow cleanly downstream and Claude Code receives only what's new.
- Reads template files (ARCHITECTURE_TEMPLATE.md, GUARDRAIL_SPEC.md, etc.) from the target project to inform architecture generation when reusable patterns exist.
- Writes atomically (temp file + rename) so a crash mid-write never corrupts cascade documents.
- Restricts file access to the four cascade documents and configured template files; path traversal attempts are rejected.

## What it does not do

- Replace the architect. Cascadia automates translation between layers; judgment, taste, and stakeholder context stay with the human.
- Reason about the target project's content beyond the four cascade documents and any template files.
- Hand off automatically to Claude Code. The architect copies the generated SYSTEM_INSTRUCTIONS entry into the Claude Code CLI; this preserves a human review step at the most consequential handoff.
- Provide multi-user or production-grade features. Cascadia is a single-architect prototype tool.

## Theory of operation

Cascadia is the working instrument for a methodology described in the article *AI-Generated Software Should Be Recompilable*. The short version is reproduced below; the long version is essential reading for anyone who wants to understand why Cascadia is shaped the way it is.

### Four roles, not one

In traditional development, one role mattered during the build: the developer, translating intent into syntax. In AI-assisted development, four roles must be held separate:

1. **Source of requirements** — the stakeholder. Knows what should exist in the world.
2. **Architect** — holds strategy, constraints, tradeoffs. Conducts the build.
3. **Translator** — a chat AI (Claude, ChatGPT, Gemini in chat mode). Converts strategy into agent instructions.
4. **Coder** — the coding agent (Claude Code, Cursor, Copilot, Codex). Writes files, runs commands, modifies the codebase.

Roles 3 and 4 are different AIs with different jobs. Senior engineers using "AI to code faster" typically collapse roles 2, 3, and 4 into a single chat with the coding agent. The output is the software equivalent of dictating a novel directly to the printing press.

### The recompilable cascade

When the methodology is followed, the project's source documents form a layered architecture with a compiler-like cascade:

REQUIREMENTS.md → (architect) → STRATEGY.md → (translator) → SYSTEM_INSTRUCTIONS.md → (coder) → implementation

Each layer is plain text. Each layer is independently editable. Each layer can be regenerated from the layer above it.

This is **recompilability**, and it is the property the industry is currently shipping AI-generated software without. Source code in C is recompilable: feed it to any C compiler and you get a binary. STRATEGY.md is recompilable: feed it to any chat AI and you get system instructions. SYSTEM_INSTRUCTIONS.md is recompilable: feed it to any coding agent and you get an implementation. Three layers, each recompilable into the next.

The properties this stack inherits from traditional compiler stacks are the properties enterprises need:

- **Vendor independence.** No layer depends on a specific vendor. If Anthropic disappears tomorrow, the strategy document still produces system instructions when handed to a different chat AI.
- **Layer-localized failure.** Three independent questions become askable: Is the strategy wrong? Are the system instructions wrong? Is the implementation wrong? Each is independently checkable.
- **Edit in place, regenerate downstream.** If the strategy is sound but the system instructions are weak, edit the system instructions and regenerate the code. The cascade is one-way and predictable.
- **Disposable implementations.** When a session goes off the rails, scrap the code. Strategy and instructions are intact. Regenerate cleanly.
- **Reproducibility.** The project can be rebuilt from its source documents by anyone, indefinitely. The architect's value becomes durable instead of trapped in a session.

### What Cascadia adds to the methodology

The methodology stands on its own and can be practiced manually — copying documents between chat AI and coding agent by hand. Cascadia automates the orchestration: the four documents become tabs in a console, the role-to-role handoffs become API calls, and an LLM-as-judge consistency check fires after every generation to flag inconsistencies in either the AI's translation or the architect's upstream document.

Cascadia does not replace the architect. It removes the mechanical friction of running the cascade so the architect can spend attention on judgment instead of clipboard work.

### What this is not

A template. A copy of these documents does not reproduce the outcome. The methodology requires architectural taste, the ability to express systems in prose, and real-time judgment during the build. None of those download.

Pattern recognition acquired over a long engineering career is not obsolete. It is the input this method runs on. What is obsolete is the assumption that the engineer's job ends in syntax. The syntax has been demoted.

## How it works

Cascadia is portable. It does not own the workflow files it manages — those belong to whichever project the architect is building. The target is set in Cascadia's `.env`:

TARGET_WORKFLOW=/absolute/path/to/<project>/context-docs/workflow
TARGET_TEMPLATE=/absolute/path/to/<project>/context-docs/template
ANTHROPIC_API_KEY=sk-...
ANTHROPIC_MODEL=claude-opus-4-7
PORT=3000

The variable names are fixed; the values are yours. Use any Anthropic model you prefer in `ANTHROPIC_MODEL`. Other LLM providers are not supported in the current prototype.

The variable names are fixed; the values are yours. Use any Anthropic model you prefer in `ANTHROPIC_MODEL`. Other LLM providers can be supported by modifying `src/anthropic.js` to wrap a different SDK; the rest of the cascade is provider-agnostic by design.

The target project keeps its cascade documents in `context-docs/workflow/` (one .md per layer) and any reusable templates in `context-docs/template/`. Cascadia reads and writes these files; Git in the target project provides version control. Cascadia maintains no database and no draft files.

### Per Submit

1. Client persists the updated document via `PUT /api/doc/:name`.
2. Client requests downstream generation via `POST /api/generate/:target` with `{ action, payload }`.
3. Server loads upstream document(s) and any template files; calls Anthropic; runs the consistency check as a second call; returns `{ generated_content, flags }`.
4. Client redirects to the next tab, displays the generated document, surfaces any inconsistency warnings.
5. Architect reviews. If flags exist, clicking Fix triggers a second-pass revision incorporating the flags. Architect approves, then proceeds to the next layer.
6. After SYSTEM_INSTRUCTIONS is finalized, the architect copies the new entry into Claude Code in the target project.

## Quick start

```bash
git clone https://github.com/docraticmethod/cascadia.git
cd cascadia
npm install
cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY, TARGET_WORKFLOW, TARGET_TEMPLATE
node src/server.js
```

Open `http://localhost:3000`. The four tabs present the cascade layers for the target project specified in `.env`.

## Target project layout

Cascadia assumes the target project's directory looks like this:

```
<target-project>/
├── context-docs/
│   ├── workflow/
│   │   ├── REQUIREMENTS.md
│   │   ├── STRATEGY.md
│   │   ├── ARCHITECTURE.md
│   │   └── SYSTEM_INSTRUCTIONS.md
│   ├── template/            # optional; loaded during architecture generation
│   │   └── *.md             # any .md files; filenames are not hardcoded
│   └── app/                 # optional; not touched by Cascadia
│       ├── CLAUDE.md
│       ├── ENVIRONMENT.md
│       ├── DECISIONS.md
│       ├── TODO.md
│       └── CUSTOMER.md
├── src/
├── data/
└── ...
```

The four workflow files start empty. Cascadia populates them as the architect drives the cascade forward.

## Tech stack

- Node 24, ESM
- Express 5
- `@anthropic-ai/sdk`
- Vanilla HTML/CSS/JS frontend, no build step
- No database; Git in the target project owns versioning

## Status

Working prototype. Validated end-to-end on a non-trivial reg-tech build (emergency department triage support assistant): cascade fired cleanly, consistency check produced substantive flags, fix pass addressed them, generated SYSTEM_INSTRUCTIONS drove Claude Code to a working application.

Not production hardened. Single-architect, single-project, localhost only.

## License

Apache 2.0.