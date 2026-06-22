import { MetaMetricsEventName } from '../../../constants/metametrics';
import type { ABTestAnalyticsMapping } from '../ab-test-analytics';
import { ABTestVariant, type ABTestVariantName } from '../variants';

export const DEFI_REFERRAL_UI_AB_TEST_KEY =
  'coreExtensionUxCeux1096AbtestReferralUi';

type DefiReferralUIVariantConfig = {
  isRedesignEnabled: boolean;
};

export const DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS: Record<
  ABTestVariantName,
  DefiReferralUIVariantConfig
> = {
  [ABTestVariant.Control]: {
    isRedesignEnabled: false,
  },
  [ABTestVariant.Treatment]: {
    isRedesignEnabled: true,
  },
};

export const DEFI_REFERRAL_UI_AB_TEST_EXPOSURE_METADATA = {
  experimentName: 'DeFi Referral UI 2',
  variationNames: {
    [ABTestVariant.Control]: 'Legacy UI',
    [ABTestVariant.Treatment]: 'Redesigned UI with updated copy',
  },
} as const;

export const DEFI_REFERRAL_UI_AB_TEST_ANALYTICS_MAPPING: ABTestAnalyticsMapping =
  {
    flagKey: DEFI_REFERRAL_UI_AB_TEST_KEY,
    validVariants: [ABTestVariant.Control, ABTestVariant.Treatment],
    eventNames: [
      MetaMetricsEventName.ReferralViewed,
      MetaMetricsEventName.ReferralConfirmButtonClicked,
    ],
  };
