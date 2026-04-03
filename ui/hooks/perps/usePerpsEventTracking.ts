import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { Json } from '@metamask/utils';
import { PERPS_EVENT_PROPERTY } from '@metamask/perps-controller';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';

export type UsePerpsEventTrackingDeclarativeOptions = {
  eventName: MetaMetricsEventName;
  /**
   * When true the event fires once. The guard resets when conditions becomes
   * false, so the event fires again the next time conditions becomes true
   * (e.g. a modal that can be opened multiple times).
   */
  conditions: boolean;
  properties?: Record<string, Json>;
  /**
   * Optional key that, when changed, resets the fire-once guard so the event
   * fires again. Use when conditions stays true but the subject changes
   * (e.g. navigating between markets while the page stays mounted).
   */
  resetKey?: string | number | boolean | null;
};

export type PerpsTrackEventFn = (
  eventName: MetaMetricsEventName,
  properties?: Record<string, Json>,
) => void;

export function usePerpsEventTracking(): {
  track: PerpsTrackEventFn;
};
export function usePerpsEventTracking(
  options: UsePerpsEventTrackingDeclarativeOptions,
): void;
export function usePerpsEventTracking(
  options?: UsePerpsEventTrackingDeclarativeOptions,
): { track: PerpsTrackEventFn } | void {
  const { trackEvent } = useContext(MetaMetricsContext);
  const hasFiredDeclarativeRef = useRef(false);

  const track = useCallback<PerpsTrackEventFn>(
    (eventName, properties) => {
      trackEvent({
        event: eventName,
        category: MetaMetricsEventCategory.Perps,
        properties: {
          ...properties,
          [PERPS_EVENT_PROPERTY.TIMESTAMP]: Date.now(),
        },
      });
    },
    [trackEvent],
  );

  const imperativeApi = useMemo(() => ({ track }), [track]);

  // Reset the fire-once guard when resetKey changes so the event fires again
  // for a new subject (e.g. a different market symbol) even if conditions
  // stays true.
  const resetKey = options?.resetKey;
  useEffect(() => {
    hasFiredDeclarativeRef.current = false;
    // resetKey is intentionally the only dependency: we want to reset the
    // guard exactly when the key changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    if (!options) {
      return;
    }

    const { eventName, conditions, properties } = options;

    // Reset the guard when the condition clears so the event fires again on
    // the next open (handles modals that can be opened more than once).
    if (!conditions) {
      hasFiredDeclarativeRef.current = false;
      return;
    }

    if (hasFiredDeclarativeRef.current) {
      return;
    }

    hasFiredDeclarativeRef.current = true;
    trackEvent({
      event: eventName,
      category: MetaMetricsEventCategory.Perps,
      properties: {
        ...properties,
        [PERPS_EVENT_PROPERTY.TIMESTAMP]: Date.now(),
      },
    });
  }, [options, trackEvent]);

  if (options) {
    return undefined;
  }

  return imperativeApi;
}
