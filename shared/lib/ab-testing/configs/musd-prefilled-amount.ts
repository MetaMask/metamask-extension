import { MetaMetricsEventName } from '../../../constants/metametrics';
import type { ABTestAnalyticsMapping } from '../ab-test-analytics';

export const MUSD_PREFILLED_AMOUNT_AB_TEST_KEY =
  'earnCONF1385AbtestPrefilledMaxAmount';

export const MusdPrefilledAmountVariant = {
  Control: 'control',
  Treatment: 'treatment',
} as const;

export type MusdPrefilledAmountVariants = {
  control: {
    prefillMax: false;
  };
  treatment: {
    prefillMax: true;
  };
};

export const MUSD_PREFILLED_AMOUNT_AB_TEST_VARIANTS: MusdPrefilledAmountVariants =
  {
    [MusdPrefilledAmountVariant.Control]: {
      prefillMax: false,
    },
    [MusdPrefilledAmountVariant.Treatment]: {
      prefillMax: true,
    },
  };

export const MUSD_PREFILLED_AMOUNT_AB_TEST_EXPOSURE_METADATA = {
  experimentName: 'mUSD Conversion Pre-filled Max Amount',
  variationNames: {
    [MusdPrefilledAmountVariant.Control]: 'Empty amount field',
    [MusdPrefilledAmountVariant.Treatment]: 'Pre-filled max amount',
  },
} as const;

export const MUSD_PREFILLED_AMOUNT_AB_TEST_ANALYTICS_MAPPING: ABTestAnalyticsMapping =
  {
    flagKey: MUSD_PREFILLED_AMOUNT_AB_TEST_KEY,
    validVariants: [
      MusdPrefilledAmountVariant.Control,
      MusdPrefilledAmountVariant.Treatment,
    ],
    eventNames: [
      MetaMetricsEventName.TransactionSubmitted,
      MetaMetricsEventName.TransactionFinalized,
    ],
  };
