// Critical error events are tracked via the early Segment tracking utility,
// which is available before MetaMetricsController is initialized.
import type { CriticalErrorType } from '../../../../shared/constants/state-corruption';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { Backup } from '../../../../shared/lib/backup';
import { trackEarlySegmentEvent } from '../segment/early-segment-tracking';

/**
 * Tracks a critical error event directly to Segment.
 *
 * This bypasses MetaMetricsController (which may not be initialized during
 * critical error handling) and sends events using the backup state for consent/ID.
 *
 * @param backup - The backup state from IndexedDB containing MetaMetricsController state.
 * @param eventName - The MetaMetrics event name to track.
 * @param criticalErrorType - The type of critical error (timeout or other).
 * @param properties - Optional additional properties to include with the event.
 */
export function trackCriticalErrorEvent(
  backup: Backup | null,
  eventName: MetaMetricsEventName,
  criticalErrorType: CriticalErrorType,
  properties?: Record<string, string | boolean>,
): void {
  trackEarlySegmentEvent({
    state: backup,
    event: eventName,
    category: MetaMetricsEventCategory.Error,
    properties: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_type: criticalErrorType,
      ...(properties ?? {}),
    },
  });
}
