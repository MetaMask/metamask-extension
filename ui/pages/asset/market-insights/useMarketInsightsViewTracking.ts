import { useCallback, useEffect, useRef } from 'react';
import type { MarketInsightsReport } from '@metamask/ai-controllers';
import type { CaipAssetType } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  MARKET_INSIGHTS_EVENT_PROPERTY,
  type MarketInsightsEventSource,
  type MarketInsightsFeedbackReason,
} from '../../../../shared/constants/market-insights-events';
import { useAnalytics } from '../../../hooks/useAnalytics';

export type MarketInsightsInteractionType =
  | 'thumbs_up'
  | 'thumbs_down'
  | 'source_click'
  | 'swap'
  | 'buy';

export type TrackMarketInsightsInteractionOptions = {
  sourceUrl?: string;
  feedbackReason?: MarketInsightsFeedbackReason;
  feedbackText?: string;
};

export type UseMarketInsightsViewTrackingOptions = {
  /** CAIP-19 asset ID of the asset the view is shown for. */
  assetId: CaipAssetType | null | undefined;
  /** The market insights report rendered by the view, if any. */
  report: MarketInsightsReport | null;
  /** Surface the view was opened from. */
  source: MarketInsightsEventSource;
};

export type UseMarketInsightsViewTrackingResult = {
  /** Fires the Market Insights Interaction event. */
  trackInteraction: (
    interactionType: MarketInsightsInteractionType,
    options?: TrackMarketInsightsInteractionOptions,
  ) => void;
  /** Fires the Market Insights Closed event. */
  trackClosed: () => void;
};

/**
 * Tracks the full-screen Market Insights view analytics events:
 * "Market Insights Viewed" once per asset when its report is loaded,
 * "Market Insights Interaction" for thumbs, source, feedback, swap, and buy
 * interactions, and "Market Insights Closed" when the view is dismissed via
 * the back button.
 *
 * @param options - View context: the asset, the rendered report, and the
 * surface the view was opened from.
 * @param options.assetId - CAIP-19 asset ID of the asset the view is shown for.
 * @param options.report - The market insights report rendered by the view, if any.
 * @param options.source - Surface the view was opened from.
 * @returns The interaction and closed-event trackers.
 */
export const useMarketInsightsViewTracking = ({
  assetId,
  report,
  source,
}: UseMarketInsightsViewTrackingOptions): UseMarketInsightsViewTrackingResult => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hasTrackedViewRef = useRef(false);
  const previousAssetIdRef = useRef(assetId);

  useEffect(() => {
    if (previousAssetIdRef.current !== assetId) {
      previousAssetIdRef.current = assetId;
      hasTrackedViewRef.current = false;
    }
  }, [assetId]);

  const buildBaseProperties = useCallback(
    (): Record<string, string> => ({
      ...(assetId ? { [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: assetId } : {}),
      ...(report
        ? {
            [MARKET_INSIGHTS_EVENT_PROPERTY.DIGEST_ID]: report.digestId,
            [MARKET_INSIGHTS_EVENT_PROPERTY.ASSET_SYMBOL]: report.asset,
          }
        : {}),
      [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: source,
    }),
    [assetId, report, source],
  );

  useEffect(() => {
    if (!report || hasTrackedViewRef.current) {
      return;
    }
    hasTrackedViewRef.current = true;
    trackEvent(
      createEventBuilder(MetaMetricsEventName.MarketInsightsViewed)
        .addCategory(MetaMetricsEventCategory.MarketInsights)
        .addProperties(buildBaseProperties())
        .build(),
    ).catch(() => undefined);
  }, [report, trackEvent, createEventBuilder, buildBaseProperties]);

  const trackInteraction = useCallback(
    (
      interactionType: MarketInsightsInteractionType,
      options?: TrackMarketInsightsInteractionOptions,
    ) => {
      const builder = createEventBuilder(
        MetaMetricsEventName.MarketInsightsInteraction,
      )
        .addCategory(MetaMetricsEventCategory.MarketInsights)
        .addProperties({
          ...buildBaseProperties(),
          [MARKET_INSIGHTS_EVENT_PROPERTY.INTERACTION_TYPE]: interactionType,
          ...(options?.sourceUrl
            ? {
                [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE_URL]: options.sourceUrl,
              }
            : {}),
          ...(options?.feedbackReason
            ? {
                [MARKET_INSIGHTS_EVENT_PROPERTY.FEEDBACK_REASON]:
                  options.feedbackReason,
              }
            : {}),
        });

      if (options?.feedbackText) {
        builder.addSensitiveProperties({
          [MARKET_INSIGHTS_EVENT_PROPERTY.FEEDBACK_TEXT]: options.feedbackText,
        });
      }

      trackEvent(builder.build()).catch(() => undefined);
    },
    [trackEvent, createEventBuilder, buildBaseProperties],
  );

  const trackClosed = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.MarketInsightsClosed)
        .addCategory(MetaMetricsEventCategory.MarketInsights)
        .addProperties(buildBaseProperties())
        .build(),
    ).catch(() => undefined);
  }, [trackEvent, createEventBuilder, buildBaseProperties]);

  return { trackInteraction, trackClosed };
};
