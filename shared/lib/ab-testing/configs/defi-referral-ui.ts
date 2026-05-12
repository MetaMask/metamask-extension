import { MetaMetricsEventName } from '../../../constants/metametrics';
import type { ABTestAnalyticsMapping } from '../ab-test-analytics';

export const DEFI_REFERRAL_UI_AB_TEST_KEY =
  'coreExtensionUxCeux1024AbtestReferralUi';

export const DefiReferralUIABTestVariant = {
  Control: 'control',
  Treatment: 'treatment',
} as const;

export type DefiReferralUIABTestVariants = {
  control: {
    isRedesignEnabled: false;
  };
  treatment: {
    isRedesignEnabled: true;
  };
};

export const DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS: DefiReferralUIABTestVariants =
  {
    [DefiReferralUIABTestVariant.Control]: {
      isRedesignEnabled: false,
    },
    [DefiReferralUIABTestVariant.Treatment]: {
      isRedesignEnabled: true,
    },
  };

export const DEFI_REFERRAL_UI_AB_TEST_EXPOSURE_METADATA = {
  experimentName: 'DeFi Referral UI',
  variationNames: {
    [DefiReferralUIABTestVariant.Control]: 'Legacy UI with checkbox',
    [DefiReferralUIABTestVariant.Treatment]: 'Redesigned UI',
  },
} as const;

export const DEFI_REFERRAL_UI_AB_TEST_ANALYTICS_MAPPING: ABTestAnalyticsMapping =
  {
    flagKey: DEFI_REFERRAL_UI_AB_TEST_KEY,
    validVariants: [
      DefiReferralUIABTestVariant.Control,
      DefiReferralUIABTestVariant.Treatment,
    ],
    eventNames: [
      MetaMetricsEventName.ReferralViewed,
      MetaMetricsEventName.ReferralConfirmButtonClicked,
    ],
  };
