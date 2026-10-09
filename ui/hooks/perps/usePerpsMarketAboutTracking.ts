import { useEffect, useRef } from 'react';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { useIntersectionObserver } from '../useIntersectionObserver';
import { usePerpsEventTracking } from './usePerpsEventTracking';

export type UsePerpsMarketAboutTrackingOptions = {
  symbol?: string;
  marketType?: string;
  description?: string;
  /**
   * True only when the market detail page will paint the body that mounts
   * About. Callers pass false for the feature-unavailable redirect, the
   * missing-symbol redirect, the loading skeleton, and the unknown-market
   * state. The hook runs before those returns, so a cached description is
   * not enough to emit displayed.
   */
  isPageRendered: boolean;
};

export type UsePerpsMarketAboutTrackingReturn = {
  hasDescription: boolean;
  aboutRef: (node?: Element | null) => void;
};

export function usePerpsMarketAboutTracking({
  symbol,
  marketType,
  description,
  isPageRendered,
}: UsePerpsMarketAboutTrackingOptions): UsePerpsMarketAboutTrackingReturn {
  const trimmedDescription = description?.trim() ?? '';
  const hasDescription = trimmedDescription.length > 0;
  const isSectionDisplayed = hasDescription && isPageRendered;
  const baseProperties = {
    [PERPS_EVENT_PROPERTY.MARKET_SYMBOL]: symbol ?? '',
    [PERPS_EVENT_PROPERTY.MARKET_TYPE]: marketType ?? 'crypto',
    [PERPS_EVENT_PROPERTY.DESCRIPTION_LENGTH]: trimmedDescription.length,
  };

  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsUiInteraction,
    conditions: isSectionDisplayed,
    resetKey: symbol,
    properties: {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.MARKET_ABOUT_SECTION_DISPLAYED,
      ...baseProperties,
    },
  });

  const { track } = usePerpsEventTracking();
  const hasViewedRef = useRef(false);
  const previousSymbolRef = useRef(symbol);

  // The observed wrapper is remounted per market by the page. Reset the guard
  // here too so the fresh intersection callback can emit the next viewed event.
  useEffect(() => {
    if (previousSymbolRef.current !== symbol) {
      previousSymbolRef.current = symbol;
      hasViewedRef.current = false;
    }
  }, [symbol]);

  const [aboutRef] = useIntersectionObserver({
    threshold: 0.2,
    onChange: (isIntersecting) => {
      if (!isSectionDisplayed || !isIntersecting || hasViewedRef.current) {
        return;
      }

      hasViewedRef.current = true;
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.MARKET_ABOUT_SECTION_VIEWED,
        ...baseProperties,
      });
    },
  });

  return { hasDescription, aboutRef };
}
