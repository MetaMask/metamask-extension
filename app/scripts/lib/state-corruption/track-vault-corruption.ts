// Vault corruption events are tracked via the early Segment tracking utility,
// which is available before MetaMetricsController is initialized.
import type { Json } from '@metamask/utils';
import { VaultCorruptionType } from '../../../../shared/constants/state-corruption';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { Backup } from '../../../../shared/lib/stores/persistence-manager';
import type { SplitStatePersistenceDiagnosticsSnapshot } from '../../../../shared/lib/stores/persistence-diagnostics';
import { trackEarlySegmentEvent } from '../segment/custom-segment-tracking';

/**
 * Tracks a vault corruption event directly to Segment.
 *
 * This bypasses MetaMetricsController (which isn't initialized during corruption
 * handling) and sends events directly using the backup state for consent/ID.
 *
 * @param backup - The backup state from IndexedDB containing MetaMetricsController state.
 * @param eventName - The MetaMetrics event name to track.
 * @param corruptionType - The type of vault corruption (missing_vault_in_database, inaccessible_database).
 * @param diagnostics - Optional split-state persistence diagnostics.
 */
export function trackVaultCorruptionEvent(
  backup: Backup | null,
  eventName: MetaMetricsEventName,
  corruptionType: VaultCorruptionType,
  diagnostics?: SplitStatePersistenceDiagnosticsSnapshot,
): void {
  trackEarlySegmentEvent({
    state: backup,
    event: eventName,
    category: MetaMetricsEventCategory.Error,
    properties: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      error_type: corruptionType,
      ...(diagnostics
        ? {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            split_state_persistence_diagnostics: diagnostics as unknown as Json,
          }
        : {}),
    },
  });
}
