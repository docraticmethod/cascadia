# Cascadia

## Cascadia is a spec-driven build system console for coding agents

**Author:** Blake Rogers
**Email:** saltyfog@gmail.com
**LinkedIn:** https://www.linkedin.com/in/blakerogerz/
**Medium:** wings.medium.com

Cascadia is an AI architects' orchestration layer that sits above the coding agent and treats the specification itself as the artifact to be compiled. Input requirements and Submit; Cascadia drafts a strategy, an LLM-as-a-judge pattern flags inconsistencies, and fixes them with one click. Strategy compiles into architecture via swappable templates, flags and fixes issues, then outputs system instructions into your target project. Edit any layer in the Console and regenerate everything downstream. Hand the system instructions to Claude Code (with architecture and strategy as additional guidance) and it builds the app. You only need to give it required permissions instead of a constant back and forth chat directing it through the entire build.

**Scope:** Node/Express applications built with Claude Code. Four reference POCs built with Cascadia: two Emergency Department triage prototypes, an ex-convict recidivism risk triage prototype, and an SF AI events triage prototype.

**Model portability.** The Console itself is Anthropic-only today; using a different LLM (e.g. Gemini) would require implementing a toggle, integrating that vendor's SDK, and adding the corresponding API key to `.env`. The *target* application's model choice is decoupled from the Console — switching it is a template change: modify the architectural template to specify a different SDK. Templates are drop-in, so this is the trivial path.

## Essential reading

**[A practitioner's guide for writing requirements in a spec-driven AI build cascade](https://wings.medium.com/9d19e2fcc727?source=friends_link&sk=77738cd20abad5393956a1cbf3829a48)** 

Read this before drafting requirements for your own project. It encodes the requirements-writing lessons from four reference POCs and is the difference between a cascade that compiles cleanly and one that propagates ambiguity silently into the built application.

## Quick start 

1-a. Clone https://github.com/docraticmethod/cascadia-harness-node and rename as your new "target" project

1-b. Copy `/TARGET/context-docs/` from the console project into your target project root so workflow lives at `<project>/context-docs/workflow/`.

2. Pick a template from `/TARGET/template-library/` and drop it in your target project at `<project>/context-docs/template/`. Rename it to "ARCHITECTURE_TEMPLATE.md".

3. Create `.env`:
```
TARGET_WORKFLOW=/absolute/path/to/<project>/context-docs/workflow 
TARGET_TEMPLATE=/absolute/path/to/<project>/context-docs/template 
ANTHROPIC_API_KEY=sk-... 
ANTHROPIC_MODEL=claude-opus-4-8 
PORT=3001
```

4. `npm install && node src/server.js`

5. Open Cascadia Console at `http://localhost:3001`

<img width="1878" height="859" alt="Cascadia Console showing the four-tab cascade: REQUIREMENTS, STRATEGY, ARCHITECTURE, SYSTEM_INSTRUCTIONS" src="https://github.com/user-attachments/assets/7b75dbd0-d5e4-4149-96f3-dc599922bd3a" />

*Cascadia Console: four-tab cascade. Architecture tab shows green Fixed flags; System Instructions tab is generating.*

### Using the Console

The Unlock checkbox enables Edit/Add and disables Submit. The Lock checkbox disables Edit/Add and enables Submit. Edit any layer, Lock, Submit — downstream regenerates and the consistency check flags inconsistencies against the immediate upstream document. Click Fix on any flag for a second-pass generation that incorporates it.

## TL;DR

### What it is

Cascadia is a spec-driven build system for coding agents — an orchestration layer that sits above the coding agent and treats the specification itself as the artifact to be compiled. Where current spec-driven approaches (GitHub Spec Kit, AWS Kiro, recent Anthropic and OpenAI patterns) generate downstream specs from upstream ones with human review at the seams, Cascadia adds three properties absent from that cohort:

1. **Idempotent regeneration** of every downstream document from its upstream inputs — Make/Bazel semantics for prompt chains, not incremental edits.
2. **LLM-as-judge consistency checks** at each stage boundary, surfaced to the architect as warnings with a one-click Fix that triggers a second-pass generation incorporating the flags. Auto-fix is rejected to preserve architect agency.
3. **Static/dynamic split** in which per-project requirements are dynamic content but architectural invariants live in templates that accumulate as authoritative build inputs across projects.

### How it works

The four-stage chain — `REQUIREMENTS → STRATEGY → ARCHITECTURE → SYSTEM_INSTRUCTIONS` — keeps the architect human-in-the-loop with role-based authority at every seam. The LLM does translation work, the architect does judgment work, and the coding agent receives a system instruction it can execute without architectural interpretation.

### Template library

The current library ships three patterns:

- **Agentic harness** — orchestrator-plus-subagent fan-out pipelines with skills, eval gates, and file-based stage boundaries.
- **Generic pipeline** — non-agentic input → process → output pipelines with the same staging discipline.
- **Guardrail spec** — a two-pass preflight-plus-postflight pattern with an escalate-only invariant for reg-tech contexts (healthtech, fintech, legaltech) where conservative bias is required.

The library is extensible by design — each new architectural family (event-stream, RAG, multi-agent, workflow/state-machine, real-time API) is a one-time validation cost that benefits every subsequent build of its family.

## License

Apache 2.0