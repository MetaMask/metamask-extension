import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import type { PerpsTrackEventFn } from '../../../../hooks/perps/usePerpsEventTracking';

/**
 * Emits the PERPS_SCREEN_VIEWED "error" screen event alongside a
 * PerpsError. Both events are intentionally kept: PerpsError carries the
 * detailed failure, while this screen view records that the user was shown an
 * error state within the perps funnel.
 *
 * @param track - Imperative perps event tracker from `usePerpsEventTracking`.
 * @param errorType - The error category (matches the sibling PerpsError event).
 * @param screenName - Human-readable, non-null name of the screen that errored.
 */
export function trackPerpsErrorScreenViewed(
  track: PerpsTrackEventFn,
  errorType: string,
  screenName: string,
): void {
  track(MetaMetricsEventName.PerpsScreenViewed, {
    [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: PERPS_EVENT_VALUE.SCREEN_TYPE.ERROR,
    [PERPS_EVENT_PROPERTY.ERROR_TYPE]: errorType,
    [PERPS_EVENT_PROPERTY.SCREEN_NAME]: screenName,
  });
}
