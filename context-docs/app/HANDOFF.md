# Cascadia v2 — Claude Code Handoff

**Scope guard:** UX only. Touch nothing outside `public/` (app.js, styles.css, index.html). The spec engine, generator, server, and API contracts (`/api/doc`, `/api/generate`, `/api/fix`) are correct and frozen. Reject any change that alters backend behavior or request/response shapes.

**Sequencing is strict:** Phase 1 ships and passes its tests before Phase 2 begins. Do not interleave.

---

## Phase 1 — State control (functional fix)

### Remove
- The unlock checkbox, its label, and all `onUnlock` logic.
- The `locked` / `unlocked` modes from the per-tab state machine. Remaining modes: `viewing`, `editing`, `submitting`.

### New submit rule
- SUBMIT is enabled iff the tab has non-empty content — either the loaded document or the textarea, whichever is visible.
- Editing is **not** a prerequisite. Submitting an unedited tab submits its content as-is (same PUT + generate cascade).
- Empty tab → SUBMIT disabled/greyed. State must be legible on its face: enabled means "this will do something," disabled means "there's nothing to send."

### Idempotency (single-click)
- On click: disable SUBMIT synchronously, set `mode = 'submitting'`, then fire the request. No window for a double-fire.
- Re-enable only on error (current catch path already reverts — keep it, but revert to the new content-gated rule, not `unlocked`).
- ADD and EDIT buttons also disabled during `submitting`.

### Preserve (the function under the theater)
Recon of `public/app.js` confirmed the lock gated nothing real, but two behaviors ride on the old flow and must survive:
1. **`s.action` semantics** — ADD appends payload to existing content; EDIT replaces it. Submit payload construction depends on this. When submitting with no prior ADD/EDIT click, default `action = 'edit'` with current content.
2. **Submit-in-flight protection** — covered by idempotency above.

### Make the cascade legible
SUBMIT overwrites the doc **and** regenerates the next tab's document. Label the consequence per tab: `SUBMIT → GENERATE STRATEGY`, `SUBMIT → GENERATE ARCHITECTURE`, etc. Final tab: plain `SUBMIT`.

### Phase 1 acceptance tests (must pass before Phase 2)
- [ ] Fresh load, tab with content: SUBMIT enabled with zero prior clicks.
- [ ] Empty tab: SUBMIT disabled; typing content in ADD/EDIT enables it; clearing disables it.
- [ ] Rapid double-click SUBMIT → exactly one PUT and one generate request.
- [ ] Submit unedited tab → content saved verbatim, next tab regenerated, focus moves to next tab.
- [ ] ADD path still appends; EDIT path still replaces.
- [ ] Failed submit → error surfaced, SUBMIT re-enabled, content not lost.
- [ ] No unlock checkbox anywhere in the DOM.

---

## Phase 2 — "Minority Report" HUD (look & feel)

Reference: Underkoffler/Flick precog interface — near-black void, sparse luminous glass, generous negative space. The power is restraint. Failure mode to avoid: neon-everything / gamer-RGB.

### 2.0 Mockup first
Build one static HTML mock of the Requirements tab at `public/mock/index.html` showing: dark ground, glowing accent, pulsing status line, backlit tabs, large buttons, one flag in amber. Lock the palette there before touching app.js/styles.css.

### 2.1 Palette tokens (CSS variables, defined once)
- **Ground:** deep black-blue (e.g. `#050810` family), not gray. The void does the work.
- **Accent:** one luminous ice/cyan, used sparingly, with a real bloom — layered `box-shadow` glow, never flat bright fill.
- **Second tone:** amber, **semantic only** (flags/warnings/danger). Never decorative. This resolves the one-vs-two-tone question: two-tone, but the warm channel is reserved for meaning.

### 2.2 Components
- **Tabs:** bright, but as emitted light against black — backlit glass, not saturated blocks. Active tab glows; inactive tabs dim glass.
- **Status messages** ("AI GENERATING STRATEGY…"): large, monospace, letter-spaced, subtle pulse animation. This is the HUD voice.
- **Buttons:** significantly larger hit targets (≥48px). Doubles as accessibility.
- **Flags:** amber glow treatment for warnings; resolved flags fade toward the void.
- **Doc view / textarea:** luminous-glass panel on the void; text high-contrast.

### 2.3 Legibility check
High contrast, but verify in real lighting — the look works in a dark room; test where it'll actually be used. Confirm WCAG-ish contrast on body text and disabled states (disabled must still be readable as "disabled," not invisible).

### Standing constraints (every design call)
- Large targets, keyboard-light flows, no hover-only affordances. (Dictation integration itself is out of scope for v2 — but nothing in v2 may preclude it.)
- Operator is a strong visual designer: bring real aesthetic options at the mockup stage, not templated defaults.

### Phase 2 acceptance
- [ ] Palette lives in CSS variables; no hardcoded one-off colors.
- [ ] One cyan accent; amber appears only on flags/warnings.
- [ ] Status line pulses; animation respects `prefers-reduced-motion`.
- [ ] All interactive targets ≥48px.
- [ ] Body text contrast verified against the void ground.
- [ ] Zero behavioral diffs from Phase 1 (visual regression only).