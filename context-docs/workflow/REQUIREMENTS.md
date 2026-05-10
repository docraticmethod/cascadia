# REQUIREMENTS.md


## Project Requirements Document (from stakeholder, interpreted by architect)

Agentic Workflow Console requirements:

Single-page web UI, four tabs (REQUIREMENTS / STRATEGY / ARCHITECTURE / SYSTEM_INSTRUCTIONS), each tab navigable read-only at any time.
Per tab:

Read-only view of the canonical .md
Unlock checkbox enables ADD and EDIT buttons (EDIT disabled when doc is empty)
ADD opens empty textfield, appends on submit
EDIT opens textfield with current contents, replaces on submit
Lock checkbox enables Submit, makes textfields read-only
On Submit: save the .md, trigger downstream AI generation, redirect to next tab

Cascade on Submit:

REQUIREMENTS → AI generates STRATEGY (delta if ADD, revision if EDIT)
STRATEGY → AI generates ARCHITECTURE (loads STRATEGY.md + ARCHITECTURE_TEMPLATE.md); evaluates whether new strategy delta requires architecture change; conditional write
ARCHITECTURE → AI generates SYSTEM_INSTRUCTIONS (loads STRATEGY.md + ARCHITECTURE.md)
Spinner shown during generation

User can edit any tab independently without editing upstream — fine-tuning is allowed; AI flags inconsistencies between layers at submit (mechanism TBD).
ADD vs EDIT semantics propagate through generation prompts:

ADD upstream → fresh delta downstream → architect copies new SYSTEM_INSTRUCTIONS entry into Claude Code CLI directly
EDIT upstream → revised downstream → architect tells Claude Code "refresh context" so it re-reads the doc