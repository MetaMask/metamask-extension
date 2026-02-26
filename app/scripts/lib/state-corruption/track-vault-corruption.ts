// Vault corruption events are tracked via the early Segment tracking utility,
// which is available before MetaMetricsController is initialized.
import { VaultCorruptionType } from '../../../../shared/constants/state-corruption';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { Backup } from '../stores/persistence-manager';
import { trackEarlySegmentEvent } from '../segment/early-segment-tracking';

/**
 * Tracks a vault corruption event directly to Segment.
 *
 * This bypasses MetaMetricsController (which isn't initialized during corruption
 * handling) and sends events directly using the backup state for consent/ID.
 *
 * @param backup - The backup state from IndexedDB containing MetaMetricsController state.
 * @param eventName - The MetaMetrics event name to track.
 * @param corruptionType - The type of vault corruption (missing_vault_in_database, inaccessible_database).
 */
export function trackVaultCorruptionEvent(
  backup: Backup | null,
  eventName: MetaMetricsEventName,
  corruptionType: VaultCorruptionType,
): void {
  trackEarlySegmentEvent({
    state: backup,
    event: eventName,
    category: MetaMetricsEventCategory.Error,
    properties: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_type: corruptionType,
    },
  });
}
