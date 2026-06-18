import { MetaMetricsEventName } from '../../constants/metametrics';
import type { ABTestAnalyticsMapping } from './ab-test-analytics';

/**
 * Remote feature flag key for the Perps tab "New" badge A/B test.
 *
 * Naming follows the extension A/B flag convention enforced by
 * `test/scripts/check-ab-testing-compliance.ts`.
 */
export const PERPS_TAB_BADGE_AB_KEY = 'perpsTAT3382AbtestTabBadge';

export const PerpsTabBadgeVariant = {
  Control: 'control',
  Treatment: 'treatment',
} as const;

export type PerpsTabBadgeVariants = {
  control: { showBadge: false };
  treatment: { showBadge: true };
};

export const PERPS_TAB_BADGE_VARIANTS: PerpsTabBadgeVariants = {
  [PerpsTabBadgeVariant.Control]: { showBadge: false },
  [PerpsTabBadgeVariant.Treatment]: { showBadge: true },
};

export const PERPS_TAB_BADGE_AB_TEST_EXPOSURE_METADATA = {
  experimentName: 'Perps Tab Badge',
  variationNames: {
    control: 'No badge on Perps tab',
    treatment: '"New" badge on Perps tab',
  },
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
    validVariants: Object.values(PerpsTabBadgeVariant),
    eventNames: [MetaMetricsEventName.PerpsScreenViewed],
  };
