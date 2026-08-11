import { UnifiedSwapBridgeEventName } from '@metamask/bridge-controller';
import type { ABTestAnalyticsMapping } from '../ab-test-analytics';
import { ABTestVariant, type ABTestVariantName } from '../variants';

export const CHAIN_VALUE_ORDER_AB_KEY = 'swapsSWAPS4827AbtestChainValueOrder';

type ChainValueOrderVariantConfig = {
  orderByValue: boolean;
};

export const CHAIN_VALUE_ORDER_AB_TEST_VARIANTS: Record<
  ABTestVariantName,
  ChainValueOrderVariantConfig
> = {
  [ABTestVariant.Control]: {
    orderByValue: false,
  },
  [ABTestVariant.Treatment]: {
    orderByValue: true,
  },
};

export const CHAIN_VALUE_ORDER_AB_TEST_EXPOSURE_METADATA = {
  experimentName: 'Chain Value Order',
  variationNames: {
    [ABTestVariant.Control]: 'LaunchDarkly chain ranking',
    [ABTestVariant.Treatment]: 'Holdings value with remote position overrides',
  },
} as const;

export const CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING: ABTestAnalyticsMapping =
  {
    flagKey: CHAIN_VALUE_ORDER_AB_KEY,
    validVariants: [ABTestVariant.Control, ABTestVariant.Treatment],
    eventNames: [
      UnifiedSwapBridgeEventName.PageViewed,
      UnifiedSwapBridgeEventName.AssetPickerOpened,
      UnifiedSwapBridgeEventName.QuotesRequested,
      UnifiedSwapBridgeEventName.QuotesReceived,
      UnifiedSwapBridgeEventName.Submitted,
      UnifiedSwapBridgeEventName.Completed,
    ],
  };
