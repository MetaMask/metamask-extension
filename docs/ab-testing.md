# A/B Testing Framework

Generic A/B testing guidance for the MetaMask extension.

## Current Analytics Standard

Use these two mechanisms together:

1. Automatic exposure event: `Experiment Viewed`
2. Business event context: `active_ab_tests`

`ab_tests` is legacy and should not be used for new extension instrumentation.

## References

- [Remote feature flags contributor docs](https://github.com/MetaMask/contributor-docs/blob/main/docs/remote-feature-flags.md)
- `test/e2e/feature-flags/feature-flag-registry.ts`
- `test/e2e/tests/remote-feature-flag/remote-feature-flag.spec.ts`

## Agent Skill Entrypoints

Use these entrypoints:

- SSOT policy + execution standard: this document
- OpenAI/Codex skill entrypoint: `.agents/skills/ab-testing-implementation/SKILL.md` (`$ab-testing-implementation`)
- Claude skill entrypoint: `.claude/skills/ab-testing-implementation/SKILL.md`
- Cursor skill entrypoint: `.claude/skills/ab-testing-implementation/SKILL.md`
- Compliance check: `node --import tsx .agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts --staged`
- If no files are staged, the checker automatically falls back to changed working-tree files.
- Windsurf and other harnesses: start prompts with `Follow docs/ab-testing.md section "Agent Execution Standard (SSOT)".`

## Agent Execution Standard (SSOT)

Required agent response sections:

1. `Implementation Checklist`
2. `Files To Modify`
3. `Analytics Payload Changes`
4. `Tests To Run`
5. `Compliance Check Result`

For agent implementation or review tasks, follow this workflow exactly:

1. Run discovery before edits:

```bash
rg -n "useABTest\\(|active_ab_tests|ab_tests|Abtest|feature-flag-registry|RemoteFeatureFlagController" app shared ui test docs
rg -n "Experiment Viewed|ExperimentViewed" app shared ui
```

2. Keep experiment config centralized when reused across multiple files, preferably in a dedicated config module (`abTestConfig.ts` pattern).
3. Use `useABTest(flagKey, variants)` and normalize unresolved assignments to `control`.
4. Do not manually emit `Experiment Viewed` when using `useABTest`.
5. For business events, use `active_ab_tests: [{ key, value }]` only when assignment is active.
6. Do not add new payloads under `ab_tests`.
   - Compliance checker behavior is strict at diff-line level: adding any `ab_tests:` line in changed code fails by default.
   - For rare legacy touchpoints that cannot be migrated in the same change, use `LEGACY_AB_TEST_ALLOWED` on the line and include rationale in the PR or agent output.
7. Update tests when behavior, analytics integration, or flag plumbing changes.
   - If the change is copy-only or config-only, you may skip new tests with a brief rationale.
8. Run compliance check:

```bash
# pre-commit / local implementation flow
node --import tsx .agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts --staged

# review mode / explicit file set
node --import tsx .agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts --files app/path/to/file.ts,test/path/to/file.spec.ts --base origin/main
```

---

## How Variant Assignment Works

The extension receives remote feature flags through
`@metamask/remote-feature-flag-controller`, which fetches flags from the
client-config API.

For A/B tests, the controller does client-side bucketing from a JSON array value:

1. The remote flag returns an array where each item has `scope.value` from `0` to `1`.
2. The controller hashes `sha256(metaMetricsId + flagName)` to produce a deterministic threshold.
3. The controller selects the first array item where `userThreshold <= scope.value`.
4. The selected assignment is stored in `metamask.remoteFeatureFlags` as `{ name, value }`.

Example remote flag value:

```json
[
  {
    "name": "control",
    "scope": { "type": "threshold", "value": 0.5 }
  },
  {
    "name": "treatment",
    "scope": { "type": "threshold", "value": 1.0 }
  }
]
```

`useABTest` reads the processed assignment's `name` field and maps it to your
locally defined `variants` object.

If the user does not have a valid assignment yet, the flag is missing, the
value is invalid, or the controller did not produce a `{ name, value }`
assignment, the hook falls back to `control` and reports `isActive: false`.

---

## `useABTest` Hook

```typescript
const quickAmountsTest = useABTest(
  'swapsSWAPS4135AbtestNumpadQuickAmounts',
  {
    control: { buttons: [25, 50, 75, 'MAX'] },
    treatment: { buttons: [50, 75, 90, 'MAX'] },
  },
  {
    experimentName: 'Swaps Quick Amounts',
    variationNames: {
      control: 'Control',
      treatment: 'Larger Presets',
    },
  },
);
```

API:

```typescript
function useABTest<T extends { control: unknown } & Record<string, unknown>>(
  flagKey: string,
  variants: T,
  exposureMetadata?: {
    experimentName?: string;
    variationNames?: Partial<Record<Extract<keyof T, string>, string>>;
  },
): {
  variant: T[keyof T];
  variantName: string;
  isActive: boolean;
};
```

Behavior:

- Fallback is always `control`.
- `isActive` is `true` only when the remote assignment matches a defined variant.
- The hook supports both processed controller objects like `{ name, value }` and
  legacy string values for backward compatibility.
- When active, the hook emits `Experiment Viewed` once per
  `experiment_id + variation_id` pair per extension session.

---

## Automatic Exposure Event

`useABTest` automatically emits this event for active assignments:

- `event`: `Experiment Viewed`
- `category`: `Analytics`
- required properties:
  - `experiment_id`
  - `variation_id`
- optional properties:
  - `experiment_name`
  - `variation_name`

You should not manually fire duplicate exposure events for experiments that use
`useABTest`.

---

## Business Event Instrumentation

For page views, clicks, submits, conversions, and any other business events,
attach active experiment assignments with `active_ab_tests`.

Shape:

```typescript
type ActiveABTest = Array<{ key: string; value: string }>;
```

Single test example:

```typescript
const quickAmountsTest = useABTest('swapsSWAPS4135AbtestNumpadQuickAmounts', {
  control: { buttons: [25, 50, 75, 'MAX'] },
  treatment: { buttons: [50, 75, 90, 'MAX'] },
});

const activeABTests = quickAmountsTest.isActive
  ? [
      {
        key: 'swapsSWAPS4135AbtestNumpadQuickAmounts',
        value: quickAmountsTest.variantName,
      },
    ]
  : undefined;

trackEvent({
  event: MetaMetricsEventName.TransactionSubmitted,
  category: MetaMetricsEventCategory.Swaps,
  properties: {
    ...(activeABTests && { active_ab_tests: activeABTests }),
  },
});
```

Multiple concurrent tests:

```typescript
const buttonColorTest = useABTest('swapsSWAPS4135AbtestButtonColor', {
  control: { color: 'green' },
  treatment: { color: 'blue' },
});

const ctaTextTest = useABTest('swapsSWAPS4135AbtestCtaText', {
  control: { text: 'Get Started' },
  urgent: { text: 'Start Now' },
});

const activeABTests = [
  ...(buttonColorTest.isActive
    ? [
        {
          key: 'swapsSWAPS4135AbtestButtonColor',
          value: buttonColorTest.variantName,
        },
      ]
    : []),
  ...(ctaTextTest.isActive
    ? [
        {
          key: 'swapsSWAPS4135AbtestCtaText',
          value: ctaTextTest.variantName,
        },
      ]
    : []),
];

trackEvent({
  event: MetaMetricsEventName.TransactionSubmitted,
  category: MetaMetricsEventCategory.Swaps,
  properties: {
    ...(activeABTests.length > 0 && { active_ab_tests: activeABTests }),
  },
});
```

Do not emit per-test nested properties under `ab_tests`.

---

## Local Development Overrides

To force a specific variant locally, override the processed assignment in
`.manifest-overrides.json`:

```json
{
  "_flags": {
    "remoteFeatureFlags": {
      "swapsSWAPS4135AbtestNumpadQuickAmounts": {
        "name": "treatment",
        "value": {
          "buttons": [50, 75, 90, "MAX"]
        }
      }
    }
  }
}
```

This mirrors the post-bucketing shape returned by
`RemoteFeatureFlagController`, which makes local overrides deterministic.

---

## E2E Test Setup

Every new remote A/B test flag should be registered in
`test/e2e/feature-flags/feature-flag-registry.ts` with its production default.

For A/B tests, store the exact remote JSON value in the registry, including the
threshold array, so the E2E mock remains production-accurate.

Use test-specific overrides when you need deterministic assignments in a single
test:

- `manifestFlags: { remoteFeatureFlags: { flagName: { name, value } } }`
- `FixtureBuilder.withRemoteFeatureFlags({ flagName: { name, value } })`

---

## Naming Convention

Use the same experiment key format as mobile:

`{teamName}{ticketId}Abtest{TestName}`

Example:

`swapsSWAPS4135AbtestNumpadQuickAmounts`

Recommended pattern:

- `teamName`: lower camel team token, for example `swaps`
- `ticketId`: uppercase project key plus number, for example `SWAPS4135`
- literal `Abtest`
- semantic PascalCase test name

---

## Implementation Checklist

- [ ] Remote flag created with threshold-array JSON value
- [ ] `useABTest` added in the feature component
- [ ] `Experiment Viewed` fires for active assignments
- [ ] Business events include `active_ab_tests`
- [ ] E2E feature flag registry updated with production default
- [ ] Local override path documented for QA if needed

---

## FAQ

**Q: What is the fallback variant?**  
`control`.

**Q: When is `isActive` false?**  
When the hook is using the fallback because the assignment is missing, invalid,
or unresolved.

**Q: Do I manually emit `Experiment Viewed`?**  
No, not when using `useABTest`.

**Q: Should I send both `ab_tests` and `active_ab_tests`?**  
No. Use `active_ab_tests`.

**Q: What if basic functionality or metrics are unavailable?**  
If the extension does not have a usable experiment assignment, `useABTest`
falls back to `control` and does not emit an exposure event.

---

## Related Files

- `ui/hooks/useABTest.ts`
- `ui/hooks/useABTest.test.ts`
- `shared/constants/metametrics.ts`
- `ui/selectors/remote-feature-flags.ts`
- `test/e2e/feature-flags/feature-flag-registry.ts`
