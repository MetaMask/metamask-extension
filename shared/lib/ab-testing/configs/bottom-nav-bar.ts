import { MetaMetricsEventName } from '../../../constants/metametrics';
import type { ABTestAnalyticsMapping } from '../ab-test-analytics';
import { ABTestVariant, type ABTestVariantName } from '../variants';

export const BOTTOM_NAV_AB_TEST_KEY = 'coreExtensionUxCeux1141AbtestBottomNav';

type BottomNavVariantConfig = {
  withBottomNavBar: boolean;
};

export const BOTTOM_NAV_AB_TEST_VARIANTS: Record<
  ABTestVariantName,
  BottomNavVariantConfig
> = {
  [ABTestVariant.Control]: {
    withBottomNavBar: false,
  },
  [ABTestVariant.Treatment]: {
    withBottomNavBar: true,
  },
};

export const BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA = {
  experimentName: 'Bottom Nav Bar',
  variationNames: {
    [ABTestVariant.Control]: 'No bottom nav bar',
    [ABTestVariant.Treatment]: 'With bottom nav bar',
  },
} as const;

export const BOTTOM_NAV_AB_TEST_ANALYTICS_MAPPING: ABTestAnalyticsMapping = {
  flagKey: BOTTOM_NAV_AB_TEST_KEY,
  validVariants: [ABTestVariant.Control, ABTestVariant.Treatment],
  eventNames: [
    MetaMetricsEventName.TokenScreenViewed,
    MetaMetricsEventName.PerpsScreenViewed,
    MetaMetricsEventName.ActivityScreenViewed,
    'Unified SwapBridge Page Viewed',
  ],
};
