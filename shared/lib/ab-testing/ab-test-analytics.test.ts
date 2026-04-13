import * as ManifestFlags from '../manifestFlags';
import type { MetaMetricsEventPayload } from '../../constants/metametrics';
import {
  AB_TEST_ANALYTICS_MAPPINGS,
  enrichWithABTests,
  getRemoteFeatureFlagsWithManifestOverrides,
  hasABTestAnalyticsMappingForEvent,
} from './ab-test-analytics';

const createEvent = (
  event: string,
  properties: Record<string, unknown> = {},
): MetaMetricsEventPayload => ({
  event,
  category: 'Unit Test',
  properties,
});

describe('ab-test-analytics', () => {
  beforeEach(() => {
    AB_TEST_ANALYTICS_MAPPINGS.splice(0, AB_TEST_ANALYTICS_MAPPINGS.length);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('hasABTestAnalyticsMappingForEvent', () => {
    it('returns true when an event is allowlisted', () => {
      AB_TEST_ANALYTICS_MAPPINGS.push({
        flagKey: 'cardCARD338AbtestAttentionBadge',
        validVariants: ['control', 'withBadge'],
        eventNames: ['Card Button Viewed'],
      });

      expect(
        hasABTestAnalyticsMappingForEvent('Card Button Viewed'),
      ).toBe(true);
    });

    it('returns false when an event is not allowlisted', () => {
      AB_TEST_ANALYTICS_MAPPINGS.push({
        flagKey: 'cardCARD338AbtestAttentionBadge',
        validVariants: ['control', 'withBadge'],
        eventNames: ['Card Button Viewed'],
      });

      expect(
        hasABTestAnalyticsMappingForEvent('Unrelated Event'),
      ).toBe(false);
    });
  });

  describe('enrichWithABTests', () => {
    beforeEach(() => {
      AB_TEST_ANALYTICS_MAPPINGS.push(
        {
          flagKey: 'cardCARD338AbtestAttentionBadge',
          validVariants: ['control', 'withBadge'],
          eventNames: ['Card Button Viewed'],
        },
        {
          flagKey: 'swapsSWAPS4135AbtestNumpadQuickAmounts',
          validVariants: ['control', 'treatment'],
          eventNames: ['Unified SwapBridge Page Viewed'],
        },
        {
          flagKey: 'swapsSWAPS4242AbtestTokenSelectorBalanceLayout',
          validVariants: ['control', 'treatment'],
          eventNames: ['Unified SwapBridge Page Viewed'],
        },
      );
    });

    it('injects one active assignment for a matching allowlisted event', () => {
      const result = enrichWithABTests(createEvent('Card Button Viewed'), {
        cardCARD338AbtestAttentionBadge: 'withBadge',
      });

      expect(result.properties).toStrictEqual({
        ['active_ab_tests']: [
          {
            key: 'cardCARD338AbtestAttentionBadge',
            value: 'withBadge',
          },
        ],
      });
    });

    it('injects multiple assignments when multiple tests match the same event', () => {
      const result = enrichWithABTests(
        createEvent('Unified SwapBridge Page Viewed'),
        {
          swapsSWAPS4135AbtestNumpadQuickAmounts: { name: 'treatment' },
          swapsSWAPS4242AbtestTokenSelectorBalanceLayout: 'control',
        },
      );

      expect(result.properties?.['active_ab_tests']).toStrictEqual([
        {
          key: 'swapsSWAPS4135AbtestNumpadQuickAmounts',
          value: 'treatment',
        },
        {
          key: 'swapsSWAPS4242AbtestTokenSelectorBalanceLayout',
          value: 'control',
        },
      ]);
    });

    it('does nothing when the event is not allowlisted', () => {
      const event = createEvent('Unrelated Event', { source: 'test' });

      expect(
        enrichWithABTests(event, {
          cardCARD338AbtestAttentionBadge: 'withBadge',
        }),
      ).toStrictEqual(event);
    });

    it('ignores missing and invalid flag values', () => {
      const event = createEvent('Unified SwapBridge Page Viewed');

      expect(
        enrichWithABTests(event, {
          swapsSWAPS4135AbtestNumpadQuickAmounts: 42,
          swapsSWAPS4242AbtestTokenSelectorBalanceLayout: 'unknown',
        }),
      ).toStrictEqual(event);
    });

    it('merges with existing active_ab_tests and preserves explicit payload values', () => {
      const result = enrichWithABTests(
        createEvent('Unified SwapBridge Page Viewed', {
          ['active_ab_tests']: [
            {
              key: 'swapsSWAPS4135AbtestNumpadQuickAmounts',
              value: 'manual-value',
            },
          ],
          ['quote_count']: 3,
        }),
        {
          swapsSWAPS4135AbtestNumpadQuickAmounts: 'treatment',
          swapsSWAPS4242AbtestTokenSelectorBalanceLayout: 'treatment',
        },
      );

      expect(result.properties).toStrictEqual({
        ['quote_count']: 3,
        ['active_ab_tests']: [
          {
            key: 'swapsSWAPS4135AbtestNumpadQuickAmounts',
            value: 'manual-value',
          },
          {
            key: 'swapsSWAPS4242AbtestTokenSelectorBalanceLayout',
            value: 'treatment',
          },
        ],
      });
    });

    it('leaves non-a-b properties and sensitive properties unchanged', () => {
      const event: MetaMetricsEventPayload = {
        event: 'Card Button Viewed',
        category: 'Unit Test',
        properties: {
          ['button_type']: 'card',
        },
        sensitiveProperties: {
          sensitive: 'value',
        },
      };

      const result = enrichWithABTests(event, {
        cardCARD338AbtestAttentionBadge: 'control',
      });

      expect(result.properties).toStrictEqual({
        ['button_type']: 'card',
        ['active_ab_tests']: [
          {
            key: 'cardCARD338AbtestAttentionBadge',
            value: 'control',
          },
        ],
      });
      expect(result.sensitiveProperties).toStrictEqual({
        sensitive: 'value',
      });
    });
  });

  describe('getRemoteFeatureFlagsWithManifestOverrides', () => {
    it('prefers manifest overrides over controller state flags', () => {
      jest.spyOn(ManifestFlags, 'getManifestFlags').mockReturnValue({
        remoteFeatureFlags: {
          swapsSWAPS4135AbtestNumpadQuickAmounts: { name: 'treatment' },
        },
      });

      expect(
        getRemoteFeatureFlagsWithManifestOverrides({
          swapsSWAPS4135AbtestNumpadQuickAmounts: { name: 'control' },
          otherFlag: true,
        }),
      ).toStrictEqual({
        swapsSWAPS4135AbtestNumpadQuickAmounts: { name: 'treatment' },
        otherFlag: true,
      });
    });
  });
});
