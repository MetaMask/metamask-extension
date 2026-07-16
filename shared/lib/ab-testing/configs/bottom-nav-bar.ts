import { FirstTimeFlowType } from '../../../constants/onboarding';
import { MetaMetricsEventName } from '../../../constants/metametrics';
import { WEEK } from '../../../constants/time';
import type { ABTestAnalyticsMapping } from '../ab-test-analytics';
import { ABTestVariant, type ABTestVariantName } from '../variants';

export const BOTTOM_NAV_AB_TEST_KEY = 'coreExtensionUxCeux1141AbtestBottomNav';

const FOUR_WEEKS_MS = 4 * WEEK;

/**
 * Evaluates whether a user meets the new-user cohort criteria for the bottom
 * nav bar experiment using the following criteria:
 * - Wallet was created (not imported) during onboarding.
 * - MetaMask was first installed within the last 4 weeks.
 *
 * @param params - The evaluation inputs.
 * @param params.installDate - Timestamp from AppMetadataController.firstTimeInfo.date.
 * @param params.onboardingType - The onboarding flow type from OnboardingController.
 */
export const evaluateBottomNavEligibility = ({
  installDate,
  onboardingType,
}: {
  installDate: number | undefined;
  onboardingType: FirstTimeFlowType | null | undefined;
}): boolean => {
  const isWalletCreator =
    onboardingType === FirstTimeFlowType.create ||
    onboardingType === FirstTimeFlowType.socialCreate;

  const isRecentInstall =
    installDate !== undefined && installDate >= Date.now() - FOUR_WEEKS_MS;

  return isWalletCreator && isRecentInstall;
};

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
    MetaMetricsEventName.TokenScreenOpened,
    MetaMetricsEventName.PerpsScreenViewed,
    MetaMetricsEventName.ActivityScreenOpened,
    'Unified SwapBridge Page Viewed',
  ],
};
