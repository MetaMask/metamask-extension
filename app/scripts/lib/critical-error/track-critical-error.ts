// Critical error events are tracked via the early Segment tracking utility,
// which is available before AnalyticsController is initialized.
import type { CriticalErrorType } from '../../../../shared/constants/state-corruption';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { createEventBuilder } from '../../../../shared/lib/analytics/create-event-builder';
import type { Backup } from '../../../../shared/lib/stores/persistence-manager';
import { trackEarlySegmentEvent } from '../segment/custom-segment-tracking';

/**
 * Tracks a critical error event directly to Segment.
 *
 * This bypasses AnalyticsController (which may not be initialized during
 * critical error handling) and sends events using the backup state for consent/ID.
 *
 * @param backup - The backup state from IndexedDB containing AnalyticsController state.
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
  const builtEvent = createEventBuilder(eventName)
    .addCategory(MetaMetricsEventCategory.Error)
    .addProperties({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_type: criticalErrorType,
      ...properties,
    })
    .build();

  trackEarlySegmentEvent({
    state: backup,
    event: builtEvent.name,
    category: builtEvent.properties.category as string,
    properties: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_type: criticalErrorType,
      ...properties,
    },
  });
}
