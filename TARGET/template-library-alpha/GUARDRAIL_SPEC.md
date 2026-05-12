# GUARDRAIL_SPEC.md

Specification for the two-pass guardrail pattern: preflight skill + postflight skill + escalate-only flow. Fed to the AI when generating SYSTEM_INSTRUCTIONS. Domain-specific values (risk categories, severity ramps, urgency labels, action groupings) are translated per project during STRATEGY → ARCHITECTURE → SYSTEM_INSTRUCTIONS.

Applies to reg-tech contexts where AI judgment is consequential and conservative bias is required: healthtech, fintech, legaltech, and similar domains.

## Premise

The model can be wrong. The cost of relaxing urgency on a case that warranted escalation is higher than the cost of escalating a case that didn't. The guardrail wraps the primary skill on both sides to enforce that asymmetry.

## 1. Preflight

A guardrail subagent inspects the raw case for risk signals the primary skill must not miss. Categories are domain-defined; common patterns:

- Out-of-range values on critical metrics (domain-specific anomalies)
- Time-sensitive signal combinations (clusters that change urgency when co-occurring)
- Missing data that would change urgency if known
- Subjective stakeholder cues (concern language, qualitative observations)

Returns:

```json
{
  "flags": [{ "category": ..., "signal": ..., "severity": ..., "must_address": ... }],
  "preflight_summary": ...
}
```

Flags pass into the primary skill as input context, so the model sees the safety concerns in its own input.

## 2. Postflight

The same guardrail re-inspects the primary skill's output against the preflight flags AND independently re-reads the case for missed signals.

Returns:

```json
{
  "agrees": ...,
  "unaddressed_flags": [...],
  "new_concerns": [...],
  "suggested_escalation": "<domain-defined enum | null>",
  "postflight_summary": ...
}
```

`suggested_escalation` is a domain-defined enum representing escalation levels (e.g., for triage: `'now' | 'monitor' | 'wait' | null`; for fintech alerts: `'block' | 'review' | 'allow' | null`). The enum must be ordered so "escalate" and "relax" are unambiguous.

## 3. Disagreement (`postflight.agrees === false`)

- Apply `suggested_escalation` — **escalate only, never relax**
- Append `unaddressed_flags` and `new_concerns` to the explanation
- Mark `{ review_required: true }` in the output
- Log to `traces/disagreements.jsonl`

## 4. Agreement (`postflight.agrees === true`)

- Pass output through unchanged
- Log to `traces/agreements.jsonl` for audit

## Invariants

- **Two-pass**: risks identified upfront, verified afterward
- **Conservative bias**: disagreement always escalates, never relaxes
- **Auditable**: every run produces a trace; every override is logged with original call, new call, and rationale

## Output schema (per case)

Domain-specific labels translate during project generation. Generic shape:

- `urgency`: domain enum (e.g., triage: `now / can_wait / missing_info`; fintech: `block / hold / approve`; legaltech: `escalate / review / proceed`)
- `actions`: grouped by escalation tier — typically three buckets ordered from most to least urgent (e.g., triage: `Immediate / Monitor / Escalate or Redirect`; fintech: `Halt / Watch / Route`; legaltech: `Stop / Flag / Forward`)
- `explanation`: brief prose referencing the signals, guidance, or context that drove the call
- `checklist`: follow-up items (assignment, notification, reassessment flag, handoff notes — domain-translated)
- `review_required`: boolean; true when guardrail overrode the primary skill
- `guardrail`: full preflight + postflight record (flags, summaries, agreement state)