import * as ManifestFlags from '../manifestFlags';
import type { MetaMetricsEventPayload } from '../../constants/metametrics';
import {
  AB_TEST_ANALYTICS_MAPPINGS,
  enrichWithABTests,
  getRemoteFeatureFlagsWithManifestOverrides,
  hasABTestAnalyticsMappingForEvent,
} from './ab-test-analytics';

const TEST_BADGE_FLAG_KEY = 'testTEST338AbtestAttentionBadge';
const TEST_QUICK_AMOUNTS_FLAG_KEY = 'testTEST4135AbtestQuickAmounts';
const TEST_LAYOUT_FLAG_KEY = 'testTEST4242AbtestBalanceLayout';

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
        flagKey: TEST_BADGE_FLAG_KEY,
        validVariants: ['control', 'withBadge'],
        eventNames: ['Card Button Viewed'],
      });

      expect(hasABTestAnalyticsMappingForEvent('Card Button Viewed')).toBe(
        true,
      );
    });

    it('returns false when an event is not allowlisted', () => {
      AB_TEST_ANALYTICS_MAPPINGS.push({
        flagKey: TEST_BADGE_FLAG_KEY,
        validVariants: ['control', 'withBadge'],
        eventNames: ['Card Button Viewed'],
      });

      expect(hasABTestAnalyticsMappingForEvent('Unrelated Event')).toBe(false);
    });
  });

  describe('enrichWithABTests', () => {
    beforeEach(() => {
      AB_TEST_ANALYTICS_MAPPINGS.push(
        {
          flagKey: TEST_BADGE_FLAG_KEY,
          validVariants: ['control', 'withBadge'],
          eventNames: ['Card Button Viewed'],
        },
        {
          flagKey: TEST_QUICK_AMOUNTS_FLAG_KEY,
          validVariants: ['control', 'treatment'],
          eventNames: ['Unified SwapBridge Page Viewed'],
        },
        {
          flagKey: TEST_LAYOUT_FLAG_KEY,
          validVariants: ['control', 'treatment'],
          eventNames: ['Unified SwapBridge Page Viewed'],
        },
      );
    });

    it('injects one active assignment for a matching allowlisted event', () => {
      const result = enrichWithABTests(createEvent('Card Button Viewed'), {
        [TEST_BADGE_FLAG_KEY]: 'withBadge',
      });

      expect(result.properties).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        active_ab_tests: [
          {
            key: TEST_BADGE_FLAG_KEY,
            value: 'withBadge',
          },
        ],
      });
    });

    it('injects multiple assignments when multiple tests match the same event', () => {
      const result = enrichWithABTests(
        createEvent('Unified SwapBridge Page Viewed'),
        {
          [TEST_QUICK_AMOUNTS_FLAG_KEY]: { name: 'treatment' },
          [TEST_LAYOUT_FLAG_KEY]: 'control',
        },
      );

      expect(result.properties?.active_ab_tests).toStrictEqual([
        {
          key: TEST_QUICK_AMOUNTS_FLAG_KEY,
          value: 'treatment',
        },
        {
          key: TEST_LAYOUT_FLAG_KEY,
          value: 'control',
        },
      ]);
    });

    it('does nothing when the event is not allowlisted', () => {
      const event = createEvent('Unrelated Event', { source: 'test' });

      expect(
        enrichWithABTests(event, {
          [TEST_BADGE_FLAG_KEY]: 'withBadge',
        }),
      ).toStrictEqual(event);
    });

    it('ignores missing and invalid flag values', () => {
      const event = createEvent('Unified SwapBridge Page Viewed');

      expect(
        enrichWithABTests(event, {
          [TEST_QUICK_AMOUNTS_FLAG_KEY]: 42,
          [TEST_LAYOUT_FLAG_KEY]: 'unknown',
        }),
      ).toStrictEqual(event);
    });

    it('merges with existing active_ab_tests and preserves explicit payload values', () => {
      const result = enrichWithABTests(
        createEvent('Unified SwapBridge Page Viewed', {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          active_ab_tests: [
            {
              key: TEST_QUICK_AMOUNTS_FLAG_KEY,
              value: 'manual-value',
            },
          ],
          // eslint-disable-next-line @typescript-eslint/naming-convention
          quote_count: 3,
        }),
        {
          [TEST_QUICK_AMOUNTS_FLAG_KEY]: 'treatment',
          [TEST_LAYOUT_FLAG_KEY]: 'treatment',
        },
      );

      expect(result.properties).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        quote_count: 3,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        active_ab_tests: [
          {
            key: TEST_QUICK_AMOUNTS_FLAG_KEY,
            value: 'manual-value',
          },
          {
            key: TEST_LAYOUT_FLAG_KEY,
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
          // eslint-disable-next-line @typescript-eslint/naming-convention
          button_type: 'card',
        },
        sensitiveProperties: {
          sensitive: 'value',
        },
      };

      const result = enrichWithABTests(event, {
        [TEST_BADGE_FLAG_KEY]: 'control',
      });

      expect(result.properties).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        button_type: 'card',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        active_ab_tests: [
          {
            key: TEST_BADGE_FLAG_KEY,
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
          [TEST_QUICK_AMOUNTS_FLAG_KEY]: { name: 'treatment' },
        },
      });

      expect(
        getRemoteFeatureFlagsWithManifestOverrides({
          [TEST_QUICK_AMOUNTS_FLAG_KEY]: { name: 'control' },
          otherFlag: true,
        }),
      ).toStrictEqual({
        [TEST_QUICK_AMOUNTS_FLAG_KEY]: { name: 'treatment' },
        otherFlag: true,
      });
    });
  });
});
