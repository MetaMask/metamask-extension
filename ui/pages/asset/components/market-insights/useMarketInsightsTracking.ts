import { useCallback, useEffect, useRef } from 'react';
import type { MarketInsightsReport } from '@metamask/ai-controllers';
import type { CaipAssetType } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  MARKET_INSIGHTS_EVENT_PROPERTY,
  type MarketInsightsEventSource,
} from '../../../../../shared/constants/market-insights-events';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useIntersectionObserver } from '../../../../hooks/useIntersectionObserver';

export const MARKET_INSIGHTS_CARD_VISIBILITY_THRESHOLD = 0.99;

export type UseMarketInsightsTrackingOptions = {
  /** CAIP-19 asset ID of the asset the card is shown for. */
  assetId: CaipAssetType | null | undefined;
  /** The market insights report rendered by the card, if any. */
  report: MarketInsightsReport | null;
  /** Surface the card is shown on. */
  source: MarketInsightsEventSource;
};

export type UseMarketInsightsTrackingResult = {
  /** Ref to attach to the element whose visibility is tracked. */
  cardRef: (node?: Element | null) => void;
  /** Fires the Market Insights Opened event. */
  trackOpened: () => void;
};

/**
 * Tracks the Market Insights entry card analytics events:
 * "Market Insights Card Scrolled to View" when the card first becomes fully
 * visible for an asset, and "Market Insights Opened" when the card is pressed.
 *
 * @param options - Card context: the asset, the rendered report, and the
 * surface the card is shown on.
 * @param options.assetId - CAIP-19 asset ID of the asset the card is shown for.
 * @param options.report - The market insights report rendered by the card, if any.
 * @param options.source - Surface the card is shown on.
 * @returns The card ref and the opened-event tracker.
 */
export const useMarketInsightsTracking = ({
  assetId,
  report,
  source,
}: UseMarketInsightsTrackingOptions): UseMarketInsightsTrackingResult => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hasFiredRef = useRef(false);
  const previousAssetIdRef = useRef(assetId);

  const buildEvent = useCallback(
    (eventName: MetaMetricsEventName, properties: Record<string, string>) =>
      createEventBuilder(eventName)
        .addCategory(MetaMetricsEventCategory.MarketInsights)
        .addProperties(properties)
        .build(),
    [createEventBuilder],
  );

  const [cardRef, isCardVisible] = useIntersectionObserver({
    threshold: MARKET_INSIGHTS_CARD_VISIBILITY_THRESHOLD,
  });

  useEffect(() => {
    if (previousAssetIdRef.current !== assetId) {
      previousAssetIdRef.current = assetId;
      hasFiredRef.current = false;
    }
    if (!isCardVisible || hasFiredRef.current || !assetId || !report) {
      return;
    }
    hasFiredRef.current = true;
    trackEvent(
      buildEvent(MetaMetricsEventName.MarketInsightsCardScrolledToView, {
        [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: assetId,
        [MARKET_INSIGHTS_EVENT_PROPERTY.ASSET_SYMBOL]: report.asset,
        [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: source,
        [MARKET_INSIGHTS_EVENT_PROPERTY.DIGEST_ID]: report.digestId,
      }),
    );
  }, [isCardVisible, assetId, report, source, trackEvent, buildEvent]);

  const trackOpened = useCallback(() => {
    if (!assetId) {
      return;
    }
    trackEvent(
      buildEvent(MetaMetricsEventName.MarketInsightsOpened, {
        [MARKET_INSIGHTS_EVENT_PROPERTY.CAIP19]: assetId,
        [MARKET_INSIGHTS_EVENT_PROPERTY.SOURCE]: source,
        ...(report && {
          [MARKET_INSIGHTS_EVENT_PROPERTY.ASSET_SYMBOL]: report.asset,
          [MARKET_INSIGHTS_EVENT_PROPERTY.DIGEST_ID]: report.digestId,
        }),
      }),
    );
  }, [assetId, report, source, trackEvent, buildEvent]);

  return { cardRef, trackOpened };
};
