import { UnifiedSwapBridgeEventName } from '@metamask/bridge-controller';
import type { AnalyticsEvent } from '../../analytics/create-event-builder';
import {
  enrichWithABTests,
  registerABTestAnalyticsMapping,
  clearABTestAnalyticsMappings,
} from '../ab-test-analytics';
import { createActiveABTestAssignment } from '../active-ab-test-assignment';
import { ABTestVariant } from '../variants';
import {
  CHAIN_VALUE_ORDER_AB_KEY,
  CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING,
  CHAIN_VALUE_ORDER_AB_TEST_EXPOSURE_METADATA,
  CHAIN_VALUE_ORDER_AB_TEST_VARIANTS,
} from './chain-value-order';

function createEvent(name: string): AnalyticsEvent {
  return {
    name,
    properties: {},
    sensitiveProperties: {},
  };
}

describe('chain-value-order config', () => {
  afterEach(() => clearABTestAnalyticsMappings());

  it('uses the SWAPS-4827 Extension experiment key', () => {
    expect(CHAIN_VALUE_ORDER_AB_KEY).toBe(
      'swapsSWAPS4827AbtestChainValueOrder',
    );
  });

  it('defines control and treatment behavior', () => {
    expect(CHAIN_VALUE_ORDER_AB_TEST_VARIANTS).toStrictEqual({
      control: { orderByValue: false },
      treatment: { orderByValue: true },
    });
  });

  it('defines descriptive exposure metadata for both variants', () => {
    expect(CHAIN_VALUE_ORDER_AB_TEST_EXPOSURE_METADATA).toStrictEqual({
      experimentName: 'Chain Value Order',
      variationNames: {
        control: 'LaunchDarkly chain ranking',
        treatment: 'Holdings value with remote position overrides',
      },
    });
  });

  it('maps all Unified Swaps funnel events', () => {
    expect(CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING).toStrictEqual({
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
    });
  });

  it('enriches mapped events with the canonical assignment', () => {
    registerABTestAnalyticsMapping(CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING);

    const result = enrichWithABTests(
      createEvent(UnifiedSwapBridgeEventName.Submitted),
      {
        [CHAIN_VALUE_ORDER_AB_KEY]: { name: 'treatment' },
      },
    );

    expect(result.properties?.active_ab_tests).toStrictEqual([
      createActiveABTestAssignment(CHAIN_VALUE_ORDER_AB_KEY, 'treatment'),
    ]);
  });

  it('does not enrich unrelated events', () => {
    registerABTestAnalyticsMapping(CHAIN_VALUE_ORDER_AB_TEST_ANALYTICS_MAPPING);

    const result = enrichWithABTests(createEvent('Unrelated Event'), {
      [CHAIN_VALUE_ORDER_AB_KEY]: { name: 'treatment' },
    });

    expect(result.properties?.active_ab_tests).toBeUndefined();
  });
});
