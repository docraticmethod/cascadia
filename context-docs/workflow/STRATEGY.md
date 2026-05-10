# STRATEGY.md

## Purpose
A web-based command console that operationalizes a four-stage recompilable cascade for AI-assisted software projects: REQUIREMENTS → STRATEGY → ARCHITECTURE → SYSTEM_INSTRUCTIONS. The console persists each layer as a markdown artifact, orchestrates AI generation between layers, and routes the final output to Claude Code via human-mediated handoff.

## Core principle
The console enforces the cascade. It does not change it. The architect remains the human-in-the-loop at every seam — making editorial decisions, approving generated artifacts, and copying system instructions into Claude Code. The AI does translation work; the architect does judgment work.

## Data flow
1. Architect enters or edits REQUIREMENTS via the Requirements tab.
2. On Submit, REQUIREMENTS.md is persisted, then sent to the AI to generate STRATEGY.md. Architect is redirected to Strategy tab; spinner shown during generation.
3. Architect reviews, optionally edits/adds to STRATEGY, then Submits. STRATEGY.md is persisted, then sent (with ARCHITECTURE_TEMPLATE.md and GUARDRAIL_SPEC.md as context) to the AI to generate ARCHITECTURE.md. Redirect to Architecture tab.
4. Architect reviews, optionally edits/adds, then Submits. STRATEGY.md and ARCHITECTURE.md are sent to the AI to generate SYSTEM_INSTRUCTIONS.md. Redirect to System Instructions tab.
5. Architect copies the new system instruction entry from the System Instructions tab into the Claude Code CLI.

## Two action types
Every change to a context document is either ADD (append a new section) or EDIT (revise existing content). The action type propagates downstream:

- **ADD upstream → ADD downstream.** A new requirement produces a new strategy entry, which produces a new architecture entry (if needed), which produces a new system instruction entry. The architect copies the new system instruction into Claude Code as a fresh CLI input.
- **EDIT upstream → EDIT downstream.** A revision propagates as revisions to existing downstream sections. The architect tells Claude Code to refresh its context by re-reading the affected document.

This distinction matters for token economy. ADDs are fresh deltas; EDITs require Claude Code to re-read an existing document. The console never asks Claude Code to re-read a document for a new addition.

## Conditional architecture step
ARCHITECTURE generation always runs after STRATEGY, but its output may be a no-op. The AI evaluates whether the strategy delta requires architecture change. If not, the existing ARCHITECTURE.md is unchanged and the cascade proceeds to SYSTEM_INSTRUCTIONS using the unchanged architecture.

## Independent layer editing
The architect may edit or add to any layer without first editing upstream layers. This permits fine-tuning of strategy without re-deriving from requirements, fine-tuning of architecture without re-deriving from strategy, and direct edits to system instructions when the architect knows exactly what Claude Code needs. This flexibility creates the possibility of inconsistency between layers.

## Inconsistency handling
At each Submit, the AI generation step inspects the immediate upstream layer for consistency with the layer being generated. Inconsistencies are surfaced as warnings the architect can review before continuing. The architect owns reconciliation; the console flags but does not block.

## Rollback
Git provides version control for all context documents. No draft or temp files are maintained by the console.

## Invariants
- The cascade is one-way: changes flow downstream, never upstream.
- The architect is the only role with continuous accountability across the stack.
- Every AI generation step receives explicit ADD/EDIT context so deltas vs revisions are unambiguous.
- The console persists artifacts; it does not reason about the project being built.
- Claude Code receives system instructions in the CLI only via human-mediated copy-paste from the System Instructions tab, or as written instructions to review "SYSTEM_INSTRUCTIONS.md.

## Out of scope
- Automated handoff to Claude Code CLI
- Multi-architect collaboration
- Direct execution of generated code
- Reasoning about project content beyond the four cascade documents and the two template files

## Footnote - Two flags:

One — "inconsistency handling" is described but the mechanism is open: surface as warning, block submit, append note to downstream doc. I drafted "warning, architect reviews, doesn't block." 

Two — "Conditional architecture step" assumes the AI's evaluation of "is architecture change needed" is reliable. If it isn't, false negatives mean architecture drifts behind strategy silently. Worth knowing whether you want a forced minor architecture write on every strategy change (even if just "no architectural change required, see STRATEGY entry X") or trust the AI's no-op call.