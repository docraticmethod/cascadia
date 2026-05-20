# Cascadia 

## Cascadia is a spec-driven build system console for coding agents 

**Author:** Blake Rogers

**Email:** saltyfog@gmail.com

**LinkedIn:** https://www.linkedin.com/in/blakerogerz/

Cascadia Console turns plain-English requirements into a complete system-instructions document Claude Code can execute without further prompting. Input requirements and Submit; Cascadia drafts a strategy, flags inconsistencies, and fixes them with one click. Strategy compiles into architecture via swappable templates, flags and fixes issues, then outputs system instructions into your target project. Edit any layer in the Console and everything downstream regenerates. Hand the system instructions to Claude Code and it builds the app. 

For building Node/Express with Claude Code. 

## Quick start 

1. Copy `/TARGET/context-docs/` from the console project into your target project root so workflow lives at `<project>/context-docs/workflow/`.
2. Pick a template from `/TARGET/template-library/` and drop it in your target project at `<project>/context-docs/template/`.
3. Create `.env`:
```
TARGET_WORKFLOW=/absolute/path/to/<project>/context-docs/workflow 
TARGET_TEMPLATE=/absolute/path/to/<project>/context-docs/template 
ANTHROPIC_API_KEY=sk-... 
ANTHROPIC_MODEL=claude-opus-4-7 
PORT=3001
```
4. `npm install && node src/server.js`
5. Open Cascadia Console at `http://localhost:3001`

Note: The Unlock checkbox enables Edit/Add and disables Submit. The Lock checkbox disables Edit/Add and enables Submit. 

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
