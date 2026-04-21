---
name: ab-testing-implementation
description: Implement and review MetaMask Extension A/B tests using the canonical repository standard. Use for any task that adds or modifies A/B test flags, variant configs, useABTest usage, analytics payloads, or A/B-test-related tests and docs.
---

# A/B Testing Implementation

Canonical workflow for implementing and reviewing MetaMask Extension A/B
tests.

Do not use this skill for general analytics work that does not involve A/B
test flags, `useABTest`, `active_ab_tests`, or related tests/docs.

## Required Response Sections

1. `Implementation Checklist`
2. `Files To Modify`
3. `Analytics Payload Changes`
4. `Tests To Run`
5. `Compliance Check Result`

## Agent Execution Standard

For implementation or review tasks, follow this workflow:

1. Run discovery before edits.

```bash
rg -n "useABTest\\(|active_ab_tests|ab_tests|Abtest|feature-flag-registry|RemoteFeatureFlagController" app shared ui test docs
rg -n "Experiment Viewed|ExperimentViewed" app shared ui
```

2. Confirm the intended experiment shape.
   - Use a threshold-array remote flag value for production defaults.
   - Keep reused variants or metadata centralized in a config module when
     multiple files need the same definitions.
   - Keep analytics mappings background-safe in shared modules so background
     MetaMetrics code can import them without depending on `ui/`.
   - Use the same experiment key format as mobile:
     `{teamName}{ticketId}Abtest{TestName}`.
3. Implement the assignment logic correctly.
   - Prefer `useABTest(flagKey, variants)` and keep a `control` variant in
     the variants object.
   - Use `variantName` and `isActive` from the hook for business-event
     instrumentation.
   - If assignment is missing, invalid, or unresolved, the hook falls back
     to `control` and `isActive: false`.
4. Implement analytics correctly.
   - Rely on `useABTest` for the automatic `Experiment Viewed` exposure
     event.
   - Prefer allowlisted auto-enrichment on the shared MetaMetrics path.
   - Add `active_ab_tests` manually only for business events that bypass the
     shared MetaMetrics wrappers/controller path, and only when the
     assignment is active.
   - Never add new `ab_tests:` payloads. If a legacy touchpoint cannot be
     migrated in the same change, keep the line annotated with
     `LEGACY_AB_TEST_ALLOWED` and explain why.
5. Use the canonical event payload shapes.

```typescript
const experiment = useABTest('swapsSWAPS4135AbtestNumpadQuickAmounts', {
  control: { buttons: [25, 50, 75, 'MAX'] },
  treatment: { buttons: [50, 75, 90, 'MAX'] },
});

const activeABTests = experiment.isActive
  ? [
      {
        key: 'swapsSWAPS4135AbtestNumpadQuickAmounts',
        value: experiment.variantName,
      },
    ]
  : undefined;
```

6. Update tests and fixtures when behavior or flag plumbing changes.
   - If you add or modify the shared analytics registry/enricher, add unit
     coverage there and in the MetaMetrics controller path.
   - Register every new remote A/B test flag in
     `test/e2e/feature-flags/feature-flag-registry.ts` with the production
     default threshold-array JSON value.
   - Use test overrides such as `manifestFlags.remoteFeatureFlags` or
     `FixtureBuilder.withRemoteFeatureFlags(...)` when a test needs
     deterministic assignment.
   - If the change is copy-only or config-only, you may skip new tests with a brief rationale.
7. Run the A/B compliance checker using the repository's current supported
   invocation and report the result.
   - Checker path:
     `.agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts`

```bash
# Current pre-commit / local implementation example
node --import tsx .agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts --staged

# Current review-mode / explicit file set example
node --import tsx .agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts --files app/path/to/file.ts,test/path/to/file.spec.ts --base origin/main
```

## Review Checklist

- Confirm `useABTest` always has a `control` variant.
- Confirm `Experiment Viewed` is not emitted manually when `useABTest` is in
  use.
- Confirm business events use `active_ab_tests` rather than `ab_tests`.
- Confirm new automatic enrichment mappings live in background-safe shared
  modules rather than `ui/`-only config files.
- Confirm E2E flag registration and local test overrides remain production-accurate.
- Confirm the compliance checker result is included in the final response.

## Related Files

- `ui/hooks/useABTest.ts`
- `ui/hooks/useABTest.test.ts`
- `shared/lib/ab-testing/resolve-ab-test-assignment.ts`
- `shared/lib/ab-testing/ab-test-analytics.ts`
- `ui/selectors/remote-feature-flags.ts`
- `app/scripts/controllers/metametrics-controller.ts`
- `test/e2e/feature-flags/feature-flag-registry.ts`

Use `docs/ab-testing.md` only when you need deeper background, additional
examples, FAQ answers, or local override guidance beyond this workflow.
