// Vault corruption events are tracked via the early Segment tracking utility,
// which is available before AnalyticsController is initialized.
import { VaultCorruptionType } from '../../../../shared/constants/state-corruption';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { createEventBuilder } from '../../../../shared/lib/analytics/create-event-builder';
import type { Backup } from '../../../../shared/lib/stores/persistence-manager';
import { trackEarlySegmentEvent } from '../segment/custom-segment-tracking';

/**
 * Tracks a vault corruption event directly to Segment.
 *
 * This bypasses AnalyticsController (which isn't initialized during corruption
 * handling) and sends events directly using the backup state for consent/ID.
 *
 * @param backup - The backup state from IndexedDB containing AnalyticsController state.
 * @param eventName - The MetaMetrics event name to track.
 * @param corruptionType - The type of vault corruption (missing_vault_in_database, inaccessible_database).
 */
export function trackVaultCorruptionEvent(
  backup: Backup | null,
  eventName: MetaMetricsEventName,
  corruptionType: VaultCorruptionType,
): void {
  const builtEvent = createEventBuilder(eventName)
    .addCategory(MetaMetricsEventCategory.Error)
    .addProperties({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_type: corruptionType,
    })
    .build();

  trackEarlySegmentEvent({
    state: backup,
    event: builtEvent.name,
    category: builtEvent.properties.category as string,
    properties: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_type: corruptionType,
    },
  });
}
