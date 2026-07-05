# Cascadia Console v2.0.0

Spec-driven build system for coding agents. Apache-2.0.

You write the spec. Cascadia writes the build instructions.

Your agent writes the code. 

> The thing that builds the thing for the thing to build the thing. 

Attach it to your harness.

**Creator & Author:** Blake Rogers
**Email:** saltyfog@gmail.com
**LinkedIn:** https://www.linkedin.com/in/blakerogerz/
**Medium:** wings.medium.com

Applied AI Architect & Engineer | 20x | Fractional / Interim CTO | Agentic Orchestration & Spec-Driven Dev / Harness | Production AI on GCP | HIPAA-Compliant Healthtech ⛵️ I like boats.

## Built with Cascadia

**Hackathons** (live, judged, public)
- **Atomic Research** — WeaveHacks 4 — agent research team that triages what deserves a researcher's attention · [repo](https://github.com/docraticmethod/atomic-research)
- **Doctor's Orders** — Legion Health — agentic patient assistant drafting insurance preauth + denial-appeal letters · [repo](https://github.com/docraticmethod/doctors-order) https://doctors-order.vercel.app/

**Reference POCs**
- Emergency Department triage
- Prison Reentry risk triage
- SF AI-events triage
- Early-stage investor / startup-ranking tool

## Essential reading

**[A practitioner's guide for writing requirements in a spec-driven AI build cascade](https://wings.medium.com/9d19e2fcc727?source=friends_link&sk=77738cd20abad5393956a1cbf3829a48)** 

Read this before drafting requirements for your own project. It encodes the requirements-writing lessons from four reference POCs and is the difference between a cascade that compiles cleanly and one that propagates ambiguity silently into the built application.

## What it is

Cascadia is an AI architects' orchestration layer that sits above the coding agent and treats the specification itself as the artifact to be compiled. Input requirements and Submit; Cascadia drafts a strategy, an LLM-as-a-judge pattern flags inconsistencies, and fixes them with one click. Strategy compiles into architecture via swappable templates, flags and fixes issues, then outputs system instructions into your target project. Edit any layer in the Console and regenerate everything downstream. Hand the system instructions to Claude Code (with architecture and strategy as additional guidance) and it builds the app. You only need to give it required permissions instead of a constant back and forth chat directing it through the entire build.

**Scope:** Node/Express applications built with Claude Code. 


**Model portability.** The Console itself is Anthropic-only today; using a different LLM (e.g. Gemini) would require implementing a toggle, integrating that vendor's SDK, and adding the corresponding API key to `.env`. The *target* application's model choice is decoupled from the Console — switching it is a template change: modify the architectural template to specify a different SDK. Templates are drop-in, so this is the trivial path.


## Setup

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

1. Grab the requirements template from my Medium article (link above). 

2. Write up your specification. Give the requirements template to your favorite AI chatbot and have it fill out the template from your specification. 

3. Paste your complete filled out requirements template into context-docs/workflow/REQUIREMENTS.md in your project. 

4. Cascadia Console will load the REQUIREMENTS.md

5. Click "GENERATE STRATEGY". Click Fix on any problems. AI will fix it. 

6. Click "GENERATE ARCHITECTURE". Click Fix on any problems. AI will fix it. 

7. Click "GENERATE SYSTEM INSTRUCTIONS". Click Fix on any problems. AI will fix it. 

8. Tell Claude Code to read your SYSTEM_INSTRUCTIONS.md file and give you its plan. Approve the plan. 


### How it works

The four-stage chain — `REQUIREMENTS → STRATEGY → ARCHITECTURE → SYSTEM_INSTRUCTIONS` — keeps the architect human-in-the-loop with role-based authority at every seam. The LLM does translation work, the architect does judgment work, and the coding agent receives a system instruction it can execute without architectural interpretation.

1. **Idempotent regeneration** of every downstream document from its upstream inputs — Make/Bazel semantics for prompt chains, not incremental edits.
2. **LLM-as-judge consistency checks** at each stage boundary, surfaced to the architect as warnings with a one-click Fix that triggers a second-pass generation incorporating the flags. Auto-fix is rejected to preserve architect agency.
3. **Static/dynamic split** in which per-project requirements are dynamic content but architectural invariants live in templates that accumulate as authoritative build inputs across projects.

### Template library

The current library ships three patterns:

- **Agentic harness** — orchestrator-plus-subagent fan-out pipelines with skills, eval gates, and file-based stage boundaries.
- **Generic pipeline** — non-agentic input → process → output pipelines with the same staging discipline.
- **Guardrail spec** — a two-pass preflight-plus-postflight pattern with an escalate-only invariant for reg-tech contexts (healthtech, fintech, legaltech) where conservative bias is required.

The library is extensible by design — each new architectural family (event-stream, RAG, multi-agent, workflow/state-machine, real-time API) is a one-time validation cost that benefits every subsequent build of its family.

## License

Apache 2.0