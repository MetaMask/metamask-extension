# A/B Testing in MetaMask Extension

This is the canonical guide for implementing A/B tests in the MetaMask
extension.

If you are adding a new test, start with the quickstart and the end-to-end
example. The rest of the document explains the rules behind that workflow.

## Quickstart

Use this order every time:

1. Create a remote JSON flag named `{teamName}{TICKET}Abtest{TestName}`.
2. Add a single experiment config module in
   `shared/lib/ab-testing/configs/`.
3. In the feature, call `useABTest(flagKey, variants)`.
4. If the feature sends business events through the shared MetaMetrics path,
   register an `ABTestAnalyticsMapping` in background-safe shared code used by
   `shared/lib/ab-testing/ab-test-analytics.ts`.
5. If the feature uses a custom tracking path that bypasses shared MetaMetrics
   enrichment, attach `active_ab_tests` manually with
   `createActiveABTestAssignment`.
6. Update targeted tests, the E2E feature-flag registry, and local override
   guidance when needed.

## What You Need to Touch

Most A/B tests change only these places:

- A single background-safe shared experiment config module in
  `shared/lib/ab-testing/configs/`
- The feature component or hook that consumes `useABTest`
- Background-safe shared analytics mapping code used by
  `shared/lib/ab-testing/ab-test-analytics.ts`
- Tests for the feature, analytics enrichment, or hook behavior when behavior
  or instrumentation changes
- `test/e2e/feature-flags/feature-flag-registry.ts` for the
  production-accurate default flag value

## Definition of Done

An A/B test is ready when all of these are true:

- The remote JSON flag exists and uses the threshold-array format shown below
- The feature reads assignment through `useABTest`
- The variants object includes a `control` variant
- Shared MetaMetrics events are registered for auto-enrichment when needed
- Custom tracker events attach `active_ab_tests` manually with
  `createActiveABTestAssignment` when active
- Relevant tests were added or updated when behavior or analytics wiring changed
- The E2E feature-flag registry includes the production default value

## End-to-End Example

This is the smallest complete pattern for a new extension A/B test.

### 1. Create the config module

Keep the flag key, variants, and analytics mapping together in one
background-safe shared module, for example
`shared/lib/ab-testing/configs/swaps-button-color.ts`. This is the standard
pattern for extension A/B tests because the same config must be safe to import
from both UI code and background analytics code.

```typescript
import type { ABTestAnalyticsMapping } from '../../../shared/lib/ab-testing/ab-test-analytics';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';

export const FEATURE_AB_TEST_KEY = 'swapsSWAPS4135AbtestButtonColor';

export enum FeatureVariant {
  Control = 'control',
  Treatment = 'treatment',
}

type FeatureVariantConfig = {
  color: string;
};

export const FEATURE_VARIANTS: Record<FeatureVariant, FeatureVariantConfig> = {
  [FeatureVariant.Control]: { color: 'green' },
  [FeatureVariant.Treatment]: { color: 'blue' },
};

export const FEATURE_AB_TEST_ANALYTICS_MAPPING: ABTestAnalyticsMapping = {
  flagKey: FEATURE_AB_TEST_KEY,
  validVariants: Object.values(FeatureVariant),
  eventNames: [MetaMetricsEventName.TransactionSubmitted],
};
```

### 2. Use `useABTest` in the feature

`useABTest` is the supported way to resolve the assignment in UI code.

```typescript
const { variant, variantName, isActive } = useABTest(
  FEATURE_AB_TEST_KEY,
  FEATURE_VARIANTS,
  {
    experimentName: 'Button Color Test',
    variationNames: {
      control: 'Green button color',
      treatment: 'Blue button color',
    },
  },
);

const buttonColor = variant.color;
```

Important behavior:

- `control` is the fallback when the flag is missing, invalid, or unresolved
- `isActive` is `true` only when the remote assignment matches a declared
  variant
- `useABTest` automatically emits `Experiment Viewed` once per
  `experiment_id + variation_id` pair per extension session

### 3. Register business-event auto-enrichment

If the feature tracks business events through the shared MetaMetrics path,
register the mapping in background-safe shared code and keep existing mappings
intact:

```typescript
// In shared/lib/ab-testing/ab-test-analytics.ts
export const AB_TEST_ANALYTICS_MAPPINGS: ABTestAnalyticsMapping[] = [
  // Existing mappings...
  FEATURE_AB_TEST_ANALYTICS_MAPPING,
];
```

After this, shared MetaMetrics events are enriched automatically:

```typescript
trackEvent({
  event: MetaMetricsEventName.TransactionSubmitted,
  category: MetaMetricsEventCategory.Swaps,
});
```

### 4. Handle bypass paths manually

If an event bypasses the shared MetaMetrics enrichment path, add
`active_ab_tests` yourself with `createActiveABTestAssignment`. Do not copy
this pattern for `trackEvent(...)` calls that already flow through shared
enrichment.

```typescript
import { createActiveABTestAssignment } from '../../../../shared/lib/ab-testing/active-ab-test-assignment';

const activeABTests = isActive
  ? [createActiveABTestAssignment(FEATURE_AB_TEST_KEY, variantName)]
  : undefined;

sendCustomAnalyticsPayload({
  event: 'Custom Swap Metric',
  ...(activeABTests && { active_ab_tests: activeABTests }),
});
```

## The Rules That Matter

### 1. Use `useABTest`

Do this:

- Call `useABTest(flagKey, variants)` from the feature code
- Always provide a `control` variant
- Use the returned `variant`, `variantName`, and `isActive` to drive UI
  behavior

Do not do this:

- Do not read raw flag values directly in feature code
- Do not manually emit `Experiment Viewed` when using `useABTest`

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

The hook supports both processed controller assignments like `{ name, value }`
and legacy string assignments for backward compatibility.

### 2. Use `active_ab_tests` for business events

There are two analytics mechanisms, and new tests usually need both:

1. Exposure event: `Experiment Viewed`
2. Business-event context: `active_ab_tests`

Events are auto-enriched when:

- the event flows through `MetaMetricsContext.trackEvent` or
  `MetaMetricsController:trackEvent`
- and the event name is registered in background-safe shared analytics mapping
  code

If an event bypasses that shared path, attach `active_ab_tests` manually with
`createActiveABTestAssignment`.

### 3. Do not add new `ab_tests` payloads

`ab_tests` is legacy and should not be used for new payload additions.

Use this shape instead:

```typescript
type ActiveABTest = Array<{
  key: string;
  value: string;
  key_value_pair: string;
}>;
```

Correct:

```typescript
active_ab_tests: [
  createActiveABTestAssignment(FEATURE_AB_TEST_KEY, variantName),
];
```

Incorrect:

```typescript
ab_tests: {
  swapsSWAPS4135AbtestButtonColor: 'control',
};
```

## Remote Flag Setup

### Flag naming

Use this format:

`{teamName}{ticketId}Abtest{TestName}`

Example:

`swapsSWAPS4135AbtestButtonColor`

Rules:

- `teamName`: lower camel team token, for example `swaps`
- `ticketId`: uppercase project key plus number, for example `SWAPS4135`
- literal segment: exact `Abtest`
- `TestName`: semantic PascalCase name

### Flag value

Create a JSON flag and use the threshold-array format:

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

### How assignment works

The extension receives remote feature flags through
`@metamask/remote-feature-flag-controller`, which fetches flags from the
client-config API.

For A/B tests, the controller performs client-side bucketing from the JSON
array value:

1. The remote flag returns an array where each item has `scope.value` from `0`
   to `1`.
2. The controller hashes `sha256(metaMetricsId + flagName)` to produce a
   deterministic threshold.
3. The controller selects the first array item where `userThreshold <= scope.value`.
4. The selected assignment is stored in `metamask.remoteFeatureFlags` as
   `{ name, value }`.

`useABTest` reads the processed assignment's `name` field and maps it to the
locally defined `variants` object.

## Local Overrides and E2E

To force a specific variant locally, override the processed assignment in
`.manifest-overrides.json`:

```json
{
  "_flags": {
    "remoteFeatureFlags": {
      "swapsSWAPS4135AbtestButtonColor": {
        "name": "treatment",
        "value": {
          "color": "blue"
        }
      }
    }
  }
}
```

This mirrors the post-bucketing shape returned by
`RemoteFeatureFlagController`, which makes local overrides deterministic.

Every new remote A/B test flag should be registered in
`test/e2e/feature-flags/feature-flag-registry.ts` with its production default.

For A/B tests, store the exact remote JSON value in the registry, including the
threshold array, so the E2E mock remains production-accurate.

Use test-specific overrides when you need deterministic assignments in a single
test:

- `manifestFlags: { remoteFeatureFlags: { flagName: { name, value } } }`
- `FixtureBuilder.withRemoteFeatureFlags({ flagName: { name, value } })`

## Testing and Validation

Use risk-based scope:

- If behavior changed, add or update feature tests
- If analytics wiring changed, add or update analytics tests
- If the change is copy-only or config-only, you may skip new tests with a
  brief rationale

Recommended commands:

```bash
yarn jest <changed-test-file> --collectCoverage=false
node --import tsx .agents/skills/ab-testing-implementation/scripts/check-ab-testing-compliance.ts --staged
```

If you changed behavior and analytics wiring, run both the relevant feature
test and the relevant analytics test.

Helpful existing files:

- `ui/hooks/useABTest.ts`
- `ui/hooks/useABTest.test.ts`
- `shared/lib/ab-testing/active-ab-test-assignment.ts`
- `shared/lib/ab-testing/resolve-ab-test-assignment.ts`
- `shared/lib/ab-testing/ab-test-analytics.ts`
- `app/scripts/controllers/metametrics-controller.ts`
- `test/e2e/feature-flags/feature-flag-registry.ts`

## FAQ

**Do I manually emit `Experiment Viewed`?**  
No. Not when you use `useABTest`.

**Do I manually attach `active_ab_tests` to every event?**  
No. Register shared-path events for auto-enrichment. Add `active_ab_tests`
manually only for bypass paths, and use `createActiveABTestAssignment`.

**What is the fallback variant?**  
`control`.

**When is `isActive` false?**  
When the hook is using the fallback because the assignment is missing, invalid,
or unresolved.

**Do I need a per-test analytics schema key?**  
No. Use the shared `active_ab_tests` array of
`{ key, value, key_value_pair }`.

**Can multiple tests enrich the same event?**  
Yes. Multiple assignments can be included in the same `active_ab_tests` array.

## References

- [Remote feature flags contributor docs](https://github.com/MetaMask/contributor-docs/blob/main/docs/remote-feature-flags.md)
- `test/e2e/tests/remote-feature-flag/remote-feature-flag.spec.ts`
