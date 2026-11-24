import { renderHook } from '@testing-library/react';
import type { MarketInsightsReport } from '@metamask/ai-controllers';
import type { CaipAssetType } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  MARKET_INSIGHTS_EVENT_PROPERTY,
  MARKET_INSIGHTS_EVENT_VALUE,
} from '../../../../../shared/constants/market-insights-events';
import {
  MARKET_INSIGHTS_CARD_VISIBILITY_THRESHOLD,
  useMarketInsightsTracking,
} from './useMarketInsightsTracking';

const mockTrackEvent = jest.fn().mockResolvedValue(undefined);
const mockCardRef = jest.fn();
let mockIsCardVisible = false;
let latestIntersectionThreshold: number | undefined;

jest.mock('../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../../hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: ({ threshold }: { threshold: number }) => {
    latestIntersectionThreshold = threshold;
    return [mockCardRef, mockIsCardVisible, undefined];
  },
}));

const assetId = 'eip155:1/erc20:0xabc' as const;

const mockReport: MarketInsightsReport = {
  digestId: 'digest-1',
  asset: 'eth',
  generatedAt: '2024-01-01T00:00:00Z',
  headline: 'Ethereum trends upward',
  summary: 'Ethereum is trending upward on strong volume.',
  trends: [],
  sources: [],
};

const renderTrackingHook = ({
  report = mockReport,
  asset = assetId,
  isCardVisible = mockIsCardVisible,
}: {
  report?: MarketInsightsReport | null;
  asset?: CaipAssetType | null;
  isCardVisible?: boolean;
} = {}) => {
  mockIsCardVisible = isCardVisible;
  return renderHook(
    ({
      report: nextReport,
      assetId: nextAssetId,
    }: {
      report: MarketInsightsReport | null;
      assetId: CaipAssetType | null;
    }) =>
      useMarketInsightsTracking({
        assetId: nextAssetId,
        report: nextReport,
        source: MARKET_INSIGHTS_EVENT_VALUE.SOURCE.TOKEN_DETAILS,
      }),
    { initialProps: { report, assetId: asset } },
  );
};

describe('useMarketInsightsTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsCardVisible = false;
    latestIntersectionThreshold = undefined;
  });

  describe('cardRef', () => {
    it('exposes the intersection observer ref for the tracked card', () => {
      const { result } = renderTrackingHook();

      expect(result.current.cardRef).toBe(mockCardRef);
    });

    it('observes the card at full visibility', () => {
      renderTrackingHook();

      expect(latestIntersectionThreshold).toBe(
        MARKET_INSIGHTS_CARD_VISIBILITY_THRESHOLD,
      );
    });
  });

  describe('Market Insights Card Scrolled to View', () => {
    it('tracks the event with asset properties when the card becomes visible', () => {
      renderTrackingHook({ isCardVisible: true });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsCardScrolledToView,
        properties: {
          category: MetaMetricsEventCategory.MarketInsights,
          [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: assetId,
          [MARKET_INSIGHTS_EVENT_PROPERTY.ASSET_SYMBOL]: 'eth',
          [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: 'token_details',
          [MARKET_INSIGHTS_EVENT_PROPERTY.DIGEST_ID]: 'digest-1',
        },
        sensitiveProperties: {},
      });
    });

    it('tracks the event once per asset while the card stays visible', () => {
      const { rerender } = renderTrackingHook({ isCardVisible: true });

      rerender({ report: { ...mockReport }, assetId });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    });

    it('does not track the event while the report is pending', () => {
      renderTrackingHook({ isCardVisible: true, report: null });

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });

    it('tracks the event when the report arrives while the card is already visible', () => {
      const { rerender } = renderTrackingHook({
        isCardVisible: true,
        report: null,
      });

      rerender({ report: mockReport, assetId });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsCardScrolledToView,
        properties: {
          category: MetaMetricsEventCategory.MarketInsights,
          [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: assetId,
          [MARKET_INSIGHTS_EVENT_PROPERTY.ASSET_SYMBOL]: 'eth',
          [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: 'token_details',
          [MARKET_INSIGHTS_EVENT_PROPERTY.DIGEST_ID]: 'digest-1',
        },
        sensitiveProperties: {},
      });
    });

    it('does not track the event without an asset ID', () => {
      renderTrackingHook({ isCardVisible: true, asset: null });

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });

    it('does not track the event while the card is off screen', () => {
      const { rerender } = renderTrackingHook({ isCardVisible: false });

      rerender({ report: { ...mockReport }, assetId });

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });

    it('tracks the event when the card scrolls from off screen into view', () => {
      const { rerender } = renderTrackingHook({ isCardVisible: false });

      mockIsCardVisible = true;
      rerender({ report: { ...mockReport }, assetId });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsCardScrolledToView,
        properties: {
          category: MetaMetricsEventCategory.MarketInsights,
          [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: assetId,
          [MARKET_INSIGHTS_EVENT_PROPERTY.ASSET_SYMBOL]: 'eth',
          [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: 'token_details',
          [MARKET_INSIGHTS_EVENT_PROPERTY.DIGEST_ID]: 'digest-1',
        },
        sensitiveProperties: {},
      });
    });

    it('tracks the event again when the asset changes while the card stays visible', () => {
      const { rerender } = renderTrackingHook({ isCardVisible: true });

      rerender({
        report: { ...mockReport, asset: 'btc', digestId: 'digest-2' },
        assetId: 'eip155:1/erc20:0xdef' as const,
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        name: MetaMetricsEventName.MarketInsightsCardScrolledToView,
        properties: {
          category: MetaMetricsEventCategory.MarketInsights,
          [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: 'eip155:1/erc20:0xdef',
          [MARKET_INSIGHTS_EVENT_PROPERTY.ASSET_SYMBOL]: 'btc',
          [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: 'token_details',
          [MARKET_INSIGHTS_EVENT_PROPERTY.DIGEST_ID]: 'digest-2',
        },
        sensitiveProperties: {},
      });
    });
  });

  describe('Market Insights Opened', () => {
    it('tracks the event when the card is pressed', () => {
      const { result } = renderTrackingHook();

      result.current.trackOpened();

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsOpened,
        properties: {
          category: MetaMetricsEventCategory.MarketInsights,
          [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: assetId,
          [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: 'token_details',
          [MARKET_INSIGHTS_EVENT_PROPERTY.ASSET_SYMBOL]: 'eth',
          [MARKET_INSIGHTS_EVENT_PROPERTY.DIGEST_ID]: 'digest-1',
        },
        sensitiveProperties: {},
      });
    });

    it('omits report properties when the report is missing', () => {
      const { result } = renderTrackingHook({ report: null });

      result.current.trackOpened();

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsOpened,
        properties: {
          category: MetaMetricsEventCategory.MarketInsights,
          [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: assetId,
          [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: 'token_details',
        },
        sensitiveProperties: {},
      });
    });

    it('does not track the event without an asset ID', () => {
      const { result } = renderTrackingHook({ asset: null });

      result.current.trackOpened();

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });
  });
});
