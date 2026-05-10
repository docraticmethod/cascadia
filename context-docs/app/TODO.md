## TODO items

### Bug - tab lock/unlock state

The Requirements tab's lock/unlock state machine is broken. The intended state machine has five states. Implement it as follows:

State 1 (initial): checkbox unchecked with label "Unlock"; Add and Edit buttons disabled; no textfield; Submit disabled.

State 2 (unlocked, no action): user clicks the checkbox. Checkbox is now checked, label still "Unlock". Add and Edit buttons enabled. No textfield. Submit disabled.

State 3 (editing): user clicks Add or Edit. Textfield appears (empty for Add, prefilled for Edit) and is editable. Checkbox label flips to "Lock" AND checkbox is set unchecked. Add and Edit buttons hidden or disabled. Submit disabled.

State 4 (locked after edit): user clicks the checkbox (now labeled "Lock"). Checkbox is checked. Textfield becomes read-only. Submit enabled.

State 5: user clicks Submit. PUT the document, POST to /api/generate/strategy, redirect to Strategy tab. The Requirements tab returns to State 1 on next visit.

Bugs to fix:
1. Checkbox state must be reset to unchecked when transitioning from State 2 to State 3.
2. Textfield must be read-only whenever the checkbox is unchecked OR the label is "Unlock".
3. Submit must be enabled if and only if the state is State 4 (label is "Lock" AND checkbox is checked).
4. Apply the same state machine to all four tabs.

### architects note

bug fixed, REQUIREMENTS.md contain the added requirements. 

### bug (AI warnings / fixes )

The consistency-check Fix UI is wrong. Current behavior: each flag has its own orange Fix button; clicking any one regenerates the document addressing all flags; warnings and Fix buttons remain visible afterward, giving no indication the fixes landed.

Correct behavior:
1. There is exactly one Fix button per generated document, not one per flag. The button is positioned at the top of the warnings list (or below the list — your call) and is labeled "Fix all" or simply "Fix".
2. When the user clicks Fix, send all flags in a single API call to the fix endpoint. The AI returns the revised document.
3. After the fix call completes, replace the document content with the revised version.
4. Each flag's display row updates: the orange flag indicator becomes a green checkbox, and the row remains visible (so the user can read what was addressed) but is visually marked as resolved.
5. The single Fix button is removed or disabled after the fix lands.
6. Do not auto-rerun the consistency check on the revised document. The architect reviews and decides whether to Lock and Submit. (If a second consistency pass is wanted later, it can be added separately.)

Apply this to all four tabs that produce generated content (Strategy, Architecture, System Instructions). Requirements has no consistency check since it has no upstream layer.

user should be able to unlock, click  edit or add content to  
  STRATEGY.md at that point, then lock and submit.

  All tabs should have similar functionality of state 

  ### architect's note

  Above AI warning and fix button bug is fixed

### fix architecture generation by adding template files

The Console does not currently load template files when generating ARCHITECTURE.md. Add support:

1. Read TARGET_TEMPLATE from .env at startup. Path resolves to a directory containing template .md files (e.g., ARCHITECTURE_TEMPLATE.md, GUARDRAIL_SPEC.md).

2. In src/docs.js, extend readTemplate(name) to resolve against TARGET_TEMPLATE (not the previously-assumed `${TARGET_WORKFLOW}/../template/`). Update ARCHITECTURE.md in the Console's docs to reflect the new resolution path.

3. In src/generator.js, generateArchitecture must load ALL .md files present in TARGET_TEMPLATE and inject them into the prompt as context, not just ARCHITECTURE_TEMPLATE.md. The directory contents are the templates; do not hardcode filenames. If TARGET_TEMPLATE is unset or empty, generation proceeds without templates (no error).

4. The template content is appended to the system prompt under a section header like "Reference templates from the target project" before the upstream document content.

Apply only to the architecture generation step. Strategy and system_instructions generation does not load templates.


  ### minor bug (TBD - don't fix until I tell you explicitly): 
found on strategy tab but should be fixed on strategy/architecture/system_instructions tabs
  fix button is page width
  after clicking fix button it is still "active" while "AI Fixing..." message displays (as AI fixes )

  

 

  

