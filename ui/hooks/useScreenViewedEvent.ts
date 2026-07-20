import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ScreenViewedEntryPoint,
} from '../../shared/constants/metametrics';
import { selectEnabledNetworksAsCaipChainIds } from '../selectors/multichain/networks';
import { useAnalytics } from './useAnalytics';

/**
 * Fires a screen-viewed metric once on mount with the current network filter
 * and optional entry point.
 *
 * @param eventName - MetaMetrics event name to track.
 * @param entryPoint - Optional entry point for how the user reached the screen.
 */
export function useScreenViewedEvent(
  eventName: MetaMetricsEventName,
  entryPoint?: ScreenViewedEntryPoint,
): void {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const networkFilter = useSelector(selectEnabledNetworksAsCaipChainIds);

  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current) {
      return;
    }
    hasTrackedRef.current = true;

    trackEvent(
      createEventBuilder(eventName)
        .addCategory(MetaMetricsEventCategory.Home)
        .addProperties({
          /* eslint-disable @typescript-eslint/naming-convention */
          network_filter: networkFilter,
          entry_point: entryPoint,
          /* eslint-enable @typescript-eslint/naming-convention */
        })
        .build(),
    );
  }, [trackEvent, createEventBuilder, networkFilter, entryPoint, eventName]);
}
