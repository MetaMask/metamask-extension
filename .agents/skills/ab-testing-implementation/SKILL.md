---
name: ab-testing-implementation
description: Implement and review MetaMask Extension A/B tests using the canonical repository standard. Use for any task that adds or modifies A/B test flags, variant configs, useABTest usage, analytics payloads, or A/B-test-related tests and docs.
---

# A/B Testing Implementation

`docs/ab-testing.md` is the single source of truth.

Do not use this skill for general analytics work that does not involve A/B test flags, `useABTest`, `active_ab_tests`, or related tests/docs.

Follow `docs/ab-testing.md` section `Agent Execution Standard (SSOT)` for:

- workflow
- analytics rules
- risk-based testing policy
- required response sections
- compliance command

If that section is unavailable, apply these core rules:

- Use `useABTest(flagKey, variants)` with a `control` variant.
- Use `active_ab_tests: [{ key, value }]` for business events when assignment is active.
- Do not add new `ab_tests:` payloads.
- Run and report `node --import tsx .agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts --staged`.

Run and report:

```bash
node --import tsx .agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts --staged
```
