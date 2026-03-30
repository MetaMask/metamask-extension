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
  /** When true, the event is sent once (on first transition to true for this mount). */
  conditions: boolean;
  properties?: Record<string, Json>;
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
      console.log('usePerpsEventTracking', eventName, properties);
      console.log('SEGMENT_WRITE_KEY', process.env.SEGMENT_WRITE_KEY);
      console.log({
        event: eventName,
        category: MetaMetricsEventCategory.Perps,
        properties: {
          ...properties,
          [PERPS_EVENT_PROPERTY.TIMESTAMP]: Date.now(),
        },
      });
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

  useEffect(() => {
    if (!options) {
      return;
    }

    const { eventName, conditions, properties } = options;

    if (!conditions || hasFiredDeclarativeRef.current) {
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
