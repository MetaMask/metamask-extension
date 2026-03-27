---
name: ab-testing-implementation
description: Implement and review MetaMask Extension A/B tests using the canonical repository standard. Use for any task that adds or modifies A/B test flags, variant configs, useABTest usage, analytics payloads, or A/B-test-related tests and docs.
---

# A/B Testing Implementation

`docs/ab-testing.md` is the single source of truth.

Follow `docs/ab-testing.md` section `Agent Execution Standard (SSOT)` for:

- workflow
- analytics rules
- risk-based testing policy
- required response sections
- compliance command

Run and report:

```bash
node --import tsx .agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts --staged
```
