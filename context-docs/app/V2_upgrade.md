# Cascadia v2 — Work Log

Companion to [`HANDOFF.md`](./HANDOFF.md). One entry per phase.

## Phase 1 — State control (functional fix)

**Status:** complete — all 7 acceptance checks pass.
**Scope touched:** `public/app.js` only. `index.html`, `styles.css`, and all backend/API code untouched.

### Changes (`public/app.js`)

- **Removed the unlock mechanism.** Deleted the unlock checkbox + label from `buildUI`, the entire `onUnlock` function, and every `unlock-*` reference. The `locked` / `unlocked` / `ready` modes are gone.
- **Modes reduced to three:** `viewing`, `editing`, `submitting`. Initial state is `viewing`.
- **Enable/disable is content-driven, not mode-driven.** New `effectiveContent(tab)` returns the textarea value while editing, otherwise the loaded doc. The GENERATE button is enabled iff that content is non-empty (trimmed). EDIT is enabled iff the loaded doc is non-empty. ADD is always available while viewing.
- **Live gating.** Textarea has an `oninput` → `onContentInput` handler that re-runs `updateUI` while editing, so typing enables GENERATE and clearing disables it.
- **Per-tab primary button.** `SUBMIT` → per-tab GENERATE via new `GENERATE_LABEL` map:
  - Requirements → `GENERATE STRATEGY`
  - Strategy → `GENERATE ARCHITECTURE`
  - Architecture → `GENERATE SYSTEM INSTRUCTIONS`
  - System Instructions → **no primary button** (button omitted when `GENERATE_LABEL[tab]` is undefined).
  - `onSubmit` renamed `onGenerate`; button id `btn-submit-*` → `btn-generate-*`.
- **Idempotency (single click).** On click, `mode` is set to `submitting` and `updateUI` disables all buttons synchronously before the first `await`. Buttons re-enable (content-gated) when content changes or on error.
- **Default action.** Submitting with no prior ADD/EDIT click defaults `action = 'edit'` and sends the current content as-is (unchanged PUT + generate cascade). `s.action` semantics preserved: ADD appends, EDIT replaces.
- **Error path unchanged in behavior;** only the now-deleted `unlocked` revert target became `viewing`. Spinner hidden, error logged, content preserved, button re-enabled per the content rule.
- **Post-generate:** current + next tab set to `viewing` (was `locked`); focus moves to next tab via `switchTab`.

### Deliberately NOT changed (out of scope)

- ADD / EDIT behavior (append vs replace) — untouched. Current ADD appends after a blank line; there is no literal "ADDED SECTION" marker in the code and none was added.
- FIX functionality — untouched.
- File-save flow — docs still persist via `PUT /api/doc` on submit and after system generation, exactly as before.
- Backend spec engine, generator, server, and `/api/doc` `/api/generate` `/api/fix` contracts — frozen.
- `styles.css` — dead `.unlock-label` rules remain; cosmetic cleanup deferred to Phase 2.

### Acceptance checklist — all passing

Verified by loading `public/app.js` under a jsdom harness with a mocked `fetch` (deterministic, zero API spend). Harness lived in the session scratchpad; project unchanged.

- [x] Fresh load, tab with content: GENERATE enabled with zero prior clicks.
- [x] Empty tab: GENERATE disabled; typing enables; clearing disables.
- [x] Rapid double-click GENERATE → exactly one PUT + one generate (button disabled synchronously before the first `await`).
- [x] Submit unedited tab → content saved verbatim, next tab regenerated, focus advances.
- [x] ADD appends / EDIT replaces.
- [x] Failed submit → error surfaced, GENERATE re-enabled, content not lost.
- [x] No unlock checkbox anywhere in the DOM.

`node --check public/app.js` passes; server serves the updated `app.js` (no `unlock` in delivered DOM).

## Phase 2 — "Minority Report" HUD (look & feel)

**Status:** 2.0 mockup built; awaiting palette lock from operator before touching `styles.css`/`app.js`.
**Scope:** visual only; zero behavioral change from Phase 1.

### 2.0 Mockup — `public/mock/index.html`

Self-contained static mock of the Requirements tab (no external deps; opens via `file://` or `/mock/` on the server). Shows every element the handoff called for: void ground, glowing cyan accent, pulsing status line ("AI GENERATING STRATEGY…", `prefers-reduced-motion` respected), backlit glass tabs, ≥48px buttons, one amber flag, luminous-glass doc panel.

Palette lives entirely in CSS variables (Phase 2.1 satisfied in the mock). Ground (`#050810` family) and the semantic amber are constant; a mock-only switcher offers three accent treatments to lock:

- **Precog Ice** (default) — `#74e0ff`, full layered bloom. Classic precog glass.
- **Glacier** — `#46c7d6`, cooler teal-cyan, lower bloom. Maximum restraint.
- **Signal** — `#baf3ff`, near-white cyan, tight intense bloom. Clinical, brighter.

Recommendation: **Precog Ice**. **Locked by operator: Precog Ice** (`#74e0ff`, full 3-layer bloom).

### 2.1 / 2.2 — Palette + components ported to `public/styles.css`

Rewrote `styles.css` to apply the locked palette to the **real app DOM** (the classes `app.js` builds). `styles.css`-only — `app.js` untouched, so Phase 1 behavior is byte-for-byte preserved.

- **Palette tokens** — single `:root` block; ground + accent + amber all variables (no one-off hardcoded colors in components).
- **Tabs** (`.nav-btn`) — backlit glass; active tab glows cyan with bloom + underline bar; inactive tabs dim glass.
- **Buttons** (`.btn`) — ≥52px min-height; primary (GENERATE) blooms cyan; disabled stays legibly dim (opacity 0.7 + faint border), not invisible.
- **Status line** (`.spinner`) — 18px, letter-spaced, cyan, smooth `pulse`; `prefers-reduced-motion` disables it.
- **Doc view / textarea** — luminous-glass panels on the void; body text `#d9e8f2` (~14:1 on the ground).
- **Flags** — warm channel is amber. Design call: severity kept legible by tone — warning = amber `#ffb454`, danger/critical = hotter amber-red `#ff7a4d`.
- **Fix action** — a *single* button that fixes ALL flagged items at once (matches `renderFlags` → one button after the whole list; `onFix` sends the full flag set to `/api/fix`), or the user edits manually. `align-self: flex-start` so it reads as one discrete action below the list, not a full-width bar. (Mock corrected: it had wrongly nested Fix inside a single flag.)
  - Unfixed: amber outline, label **`FIX ALL`**.
  - After fix (`fixApplied`): the button stays as a disabled green **`FIXED ALL`** status (`.btn-fixed`), and every resolved flag glows **light green** (`--green #7bf0ad`, same bloom family as the accent). This **supersedes the handoff's "resolved fades toward the void"** per operator direction — resolved now reads as an active, positive green state. New green tokens added to `:root`; `app.js` `renderFlags` updated (label + persistent fixed-state button). Mock has a Flagged/Fixed toggle to preview it.
- Removed the dead `.unlock-label` rules.

Verified: 43/43 brace balance, every `app.js` class has a rule, zero `unlock` refs, server serves the new `styles.css`.

### 2.3 Legibility — operator to confirm in real lighting

Contrast (against void `#050810`): body text `#d9e8f2` ≈ 14:1 (AAA); dim text `#7f93a6` ≈ 5.5:1 (AA). Disabled-button text is intentionally low (~2:1) — reads as "disabled," relies on the border to stay visible; flagged for the operator's real-lighting check per the handoff.

### Phase 2 acceptance

- [x] Palette in CSS variables; no hardcoded one-off colors.
- [x] One cyan accent; amber only on flags/warnings/danger.
- [x] Status line pulses; animation respects `prefers-reduced-motion`.
- [x] All interactive targets ≥48px (buttons 52px, tabs 48px).
- [~] Body-text contrast verified (AAA); disabled-state contrast pending operator's real-lighting sign-off.
- [x] No functional regression from Phase 1 — Phase 1 acceptance harness still **7/7**. `app.js` change is limited to `renderFlags` (operator-directed `FIX ALL`/`FIXED ALL` label + persistent green fixed-state button); the fix flow, `onFix`, and all Phase 1 state logic are unchanged.
