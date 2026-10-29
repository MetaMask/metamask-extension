import { MetaMetricsEventName } from '../../../constants/metametrics';
import type { ABTestAnalyticsMapping } from '../ab-test-analytics';
import { ABTestVariant, type ABTestVariantName } from '../variants';

/**
 * Remote feature flag key for the Perps tab "New" badge A/B test.
 *
 * Naming follows the extension A/B flag convention enforced by
 * `test/scripts/check-ab-testing-compliance.ts`.
 */
export const PERPS_TAB_BADGE_AB_KEY = 'perpsTAT3382AbtestTabBadge';

export type PerpsTabBadgeVariants = {
  control: { showBadge: false };
  treatment: { showBadge: true };
};

export const PERPS_TAB_BADGE_VARIANTS: PerpsTabBadgeVariants = {
  [ABTestVariant.Control]: { showBadge: false },
  [ABTestVariant.Treatment]: { showBadge: true },
};

export const PERPS_TAB_BADGE_AB_TEST_EXPOSURE_METADATA = {
  experimentName: 'Perps Tab Badge',
  variationNames: {
    [ABTestVariant.Control]: 'No badge on Perps tab',
    [ABTestVariant.Treatment]: '"New" badge on Perps tab',
  } satisfies Record<ABTestVariantName, string>,
} as const;

/**
 * Analytics mapping that enriches the existing Perps tab open event
 * (`Perp Screen Viewed`) with the `active_ab_tests` assignment for this
 * experiment. Registered into `AB_TEST_ANALYTICS_MAPPINGS` by the
 * MetaMetrics controller.
 */
export const PERPS_TAB_BADGE_AB_TEST_ANALYTICS_MAPPING: ABTestAnalyticsMapping =
  {
    flagKey: PERPS_TAB_BADGE_AB_KEY,
    validVariants: [ABTestVariant.Control, ABTestVariant.Treatment],
    eventNames: [MetaMetricsEventName.PerpsScreenViewed],
  };
