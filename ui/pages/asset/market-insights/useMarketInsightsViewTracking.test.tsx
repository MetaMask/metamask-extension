import { renderHook } from '@testing-library/react';
import type { MarketInsightsReport } from '@metamask/ai-controllers';
import type { CaipAssetType } from '@metamask/utils';
import type { AnalyticsEvent } from '../../../../shared/lib/analytics/create-event-builder';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  MARKET_INSIGHTS_EVENT_PROPERTY,
  MARKET_INSIGHTS_EVENT_VALUE,
  MarketInsightsFeedbackReason,
} from '../../../../shared/constants/market-insights-events';
import {
  useMarketInsightsViewTracking,
  type MarketInsightsInteractionType,
} from './useMarketInsightsViewTracking';

const mockTrackEvent = jest.fn((_built: AnalyticsEvent) => Promise.resolve());

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

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

const renderViewTrackingHook = ({
  report = mockReport,
  asset = assetId,
}: {
  report?: MarketInsightsReport | null;
  asset?: CaipAssetType | null;
} = {}) =>
  renderHook(
    ({
      report: nextReport,
      assetId: nextAssetId,
    }: {
      report: MarketInsightsReport | null;
      assetId: CaipAssetType | null;
    }) =>
      useMarketInsightsViewTracking({
        assetId: nextAssetId,
        report: nextReport,
        source: MARKET_INSIGHTS_EVENT_VALUE.SOURCE.TOKEN_DETAILS,
      }),
    { initialProps: { report, assetId: asset } },
  );

const expectedBaseProperties = () => ({
  category: MetaMetricsEventCategory.MarketInsights,
  [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: assetId,
  [MARKET_INSIGHTS_EVENT_PROPERTY.ASSET_SYMBOL]: 'eth',
  [MARKET_INSIGHTS_EVENT_PROPERTY.DIGEST_ID]: 'digest-1',
  [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: 'token_details',
});

describe('useMarketInsightsViewTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Market Insights Viewed', () => {
    it('tracks the event with asset properties when the report is loaded', () => {
      renderViewTrackingHook();

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsViewed,
        properties: expectedBaseProperties(),
        sensitiveProperties: {},
      });
    });

    it('tracks the event once per asset', () => {
      const { rerender } = renderViewTrackingHook();

      rerender({ report: { ...mockReport }, assetId });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    });

    it('does not track the event while the report is pending', () => {
      renderViewTrackingHook({ report: null });

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });

    it('tracks the event again when the asset changes', () => {
      const { rerender } = renderViewTrackingHook();

      rerender({
        report: { ...mockReport, asset: 'btc', digestId: 'digest-2' },
        assetId: 'eip155:1/erc20:0xdef' as const,
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        name: MetaMetricsEventName.MarketInsightsViewed,
        properties: {
          category: MetaMetricsEventCategory.MarketInsights,
          [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: 'eip155:1/erc20:0xdef',
          [MARKET_INSIGHTS_EVENT_PROPERTY.ASSET_SYMBOL]: 'btc',
          [MARKET_INSIGHTS_EVENT_PROPERTY.DIGEST_ID]: 'digest-2',
          [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: 'token_details',
        },
        sensitiveProperties: {},
      });
    });
  });

  describe('Market Insights Interaction', () => {
    const renderAndTrack = (
      interactionType: MarketInsightsInteractionType,
      options?: Parameters<
        ReturnType<typeof useMarketInsightsViewTracking>['trackInteraction']
      >[1],
    ) => {
      const { result } = renderViewTrackingHook();
      result.current.trackInteraction(interactionType, options);
    };

    it('tracks thumbs_up interactions', () => {
      renderAndTrack('thumbs_up');

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsInteraction,
        properties: {
          ...expectedBaseProperties(),
          [MARKET_INSIGHTS_EVENT_PROPERTY.INTERACTION_TYPE]: 'thumbs_up',
        },
        sensitiveProperties: {},
      });
    });

    it('tracks source_click interactions with the source URL', () => {
      renderAndTrack('source_click', { sourceUrl: 'https://a16z.com/post' });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsInteraction,
        properties: {
          ...expectedBaseProperties(),
          [MARKET_INSIGHTS_EVENT_PROPERTY.INTERACTION_TYPE]: 'source_click',
          [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE_URL]: 'https://a16z.com/post',
        },
        sensitiveProperties: {},
      });
    });

    it('tracks thumbs_down interactions with the feedback reason and text', () => {
      renderAndTrack('thumbs_down', {
        feedbackReason: MarketInsightsFeedbackReason.NotAccurate,
        feedbackText: 'The summary missed the latest move.',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsInteraction,
        properties: {
          ...expectedBaseProperties(),
          [MARKET_INSIGHTS_EVENT_PROPERTY.INTERACTION_TYPE]: 'thumbs_down',
          [MARKET_INSIGHTS_EVENT_PROPERTY.FEEDBACK_REASON]: 'not_accurate',
        },
        sensitiveProperties: {
          [MARKET_INSIGHTS_EVENT_PROPERTY.FEEDBACK_TEXT]:
            'The summary missed the latest move.',
        },
      });
    });

    it('tracks thumbs_down interactions without feedback text when none is provided', () => {
      renderAndTrack('thumbs_down', {
        feedbackReason: MarketInsightsFeedbackReason.SomethingElse,
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.MarketInsightsInteraction,
          properties: expect.objectContaining({
            [MARKET_INSIGHTS_EVENT_PROPERTY.FEEDBACK_REASON]: 'something_else',
          }),
          sensitiveProperties: {},
        }),
      );
    });

    it('tracks swap interactions', () => {
      renderAndTrack('swap');

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsInteraction,
        properties: {
          ...expectedBaseProperties(),
          [MARKET_INSIGHTS_EVENT_PROPERTY.INTERACTION_TYPE]: 'swap',
        },
        sensitiveProperties: {},
      });
    });

    it('tracks buy interactions', () => {
      renderAndTrack('buy');

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsInteraction,
        properties: {
          ...expectedBaseProperties(),
          [MARKET_INSIGHTS_EVENT_PROPERTY.INTERACTION_TYPE]: 'buy',
        },
        sensitiveProperties: {},
      });
    });

    it('omits report properties when the report is missing', () => {
      const { result } = renderViewTrackingHook({ report: null });

      result.current.trackInteraction('thumbs_up');

      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.MarketInsightsInteraction,
        properties: {
          category: MetaMetricsEventCategory.MarketInsights,
          [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: assetId,
          [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: 'token_details',
          [MARKET_INSIGHTS_EVENT_PROPERTY.INTERACTION_TYPE]: 'thumbs_up',
        },
        sensitiveProperties: {},
      });
    });
  });

  describe('Market Insights Closed', () => {
    it('tracks the event with asset properties', () => {
      const { result } = renderViewTrackingHook();

      result.current.trackClosed();

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
      expect(mockTrackEvent).toHaveBeenLastCalledWith({
        name: MetaMetricsEventName.MarketInsightsClosed,
        properties: expectedBaseProperties(),
        sensitiveProperties: {},
      });
    });
  });
});
