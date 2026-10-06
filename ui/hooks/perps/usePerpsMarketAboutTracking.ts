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
};

export type UsePerpsMarketAboutTrackingReturn = {
  hasDescription: boolean;
  aboutRef: (node?: Element | null) => void;
};

export function usePerpsMarketAboutTracking({
  symbol,
  marketType,
  description,
}: UsePerpsMarketAboutTrackingOptions): UsePerpsMarketAboutTrackingReturn {
  const trimmedDescription = description?.trim() ?? '';
  const hasDescription = trimmedDescription.length > 0;
  const baseProperties = {
    [PERPS_EVENT_PROPERTY.MARKET_SYMBOL]: symbol ?? '',
    [PERPS_EVENT_PROPERTY.MARKET_TYPE]: marketType ?? 'crypto',
    [PERPS_EVENT_PROPERTY.DESCRIPTION_LENGTH]: trimmedDescription.length,
  };

  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsUiInteraction,
    conditions: hasDescription,
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
      if (!isIntersecting || !hasDescription || hasViewedRef.current) {
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
