import { ABTestVariant, type ABTestVariantName } from '../variants';

/**
 * Remote feature flag key for the wide screen redesign A/B test.
 *
 * Naming follows the extension A/B flag convention enforced by
 * `test/scripts/check-ab-testing-compliance.ts`.
 */
export const WIDE_SCREEN_REDESIGN_AB_KEY =
  'coreCEUX1492AbtestWideScreenRedesign';

type WideScreenRedesignVariantConfig = {
  useWideLayout: boolean;
};

export const WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS: Record<
  ABTestVariantName,
  WideScreenRedesignVariantConfig
> = {
  [ABTestVariant.Control]: { useWideLayout: false },
  [ABTestVariant.Treatment]: { useWideLayout: true },
};

export const WIDE_SCREEN_REDESIGN_AB_TEST_EXPOSURE_METADATA = {
  experimentName: 'Wide Screen Redesign',
  variationNames: {
    [ABTestVariant.Control]: 'Bottom nav',
    [ABTestVariant.Treatment]: 'Side nav',
  } satisfies Record<ABTestVariantName, string>,
} as const;
