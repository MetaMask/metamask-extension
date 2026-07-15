import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ScreenViewedEntryPoint,
} from '../../../shared/constants/metametrics';
import { useAnalytics } from '../../hooks/useAnalytics';
import { selectEnabledNetworksAsCaipChainIds } from '../../selectors/multichain/networks';
import type { ActivityListFilter } from './helpers';

type UseActivityScreenViewedProps = {
  filter: ActivityListFilter | undefined;
  isSettled: boolean;
  isEmpty: boolean;
  pendingLength: number;
  entryPoint?: ScreenViewedEntryPoint;
};

/**
 * Fires the ActivityScreenViewed metric once, after the activity list has
 * settled (networks initialised + initial load complete).
 * Does nothing when `filter` is provided so it doesn't fire on asset detail view.
 * @param options0
 * @param options0.filter
 * @param options0.isSettled
 * @param options0.isEmpty
 * @param options0.pendingLength
 */
export const useActivityScreenViewed = ({
  filter,
  isSettled,
  isEmpty,
  pendingLength,
  entryPoint,
}: UseActivityScreenViewedProps) => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const networkFilter = useSelector(selectEnabledNetworksAsCaipChainIds);

  // Keep the latest metric values without making them effect dependencies so
  // the event always captures the state at the moment the list settles.
  const metricsRef = useRef({ isEmpty, pendingLength, networkFilter });
  metricsRef.current = { isEmpty, pendingLength, networkFilter };

  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (filter || !isSettled || hasTrackedRef.current) {
      return;
    }
    hasTrackedRef.current = true;

    const {
      isEmpty: empty,
      pendingLength: pending,
      networkFilter: networks,
    } = metricsRef.current;

    trackEvent(
      createEventBuilder(MetaMetricsEventName.ActivityScreenViewed)
        .addCategory(MetaMetricsEventCategory.Home)
        .addProperties({
          /* eslint-disable @typescript-eslint/naming-convention */
          network_filter: networks,
          is_empty: empty,
          pending_transactions: pending,
          entry_point: entryPoint,
          /* eslint-enable @typescript-eslint/naming-convention */
        })
        .build(),
    );
  }, [filter, isSettled, trackEvent, entryPoint]);
};
