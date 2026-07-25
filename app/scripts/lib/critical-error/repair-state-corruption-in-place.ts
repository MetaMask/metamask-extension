import { RELOAD_WINDOW } from '../../../../shared/constants/start-up-errors';
import { CriticalErrorRepairAction } from '../../../../shared/constants/state-corruption';
import type {
  Backup,
  PersistenceManager,
} from '../../../../shared/lib/stores/persistence-manager';
import { hasVault } from '../../../../shared/lib/stores/persistence-manager';

export type RepairStateCorruptionInPlaceOptions = {
  repairAction: CriticalErrorRepairAction;
  backup: Backup | null;
  connectedPorts: Set<chrome.runtime.Port>;
  initBackground: (backup: Backup | null) => Promise<void>;
  persistenceManager: Pick<PersistenceManager, 'reset'>;
  setGlobalInitializers: () => void;
  setRestoreFlowType: () => void;
  tryPostMessage: (
    port: chrome.runtime.Port,
    method: string,
    params?: Record<string, unknown>,
  ) => boolean;
};

/**
 * Repairs state corruption in the current service worker without reloading the
 * extension. Re-initializes the background from backup or reset state, then asks
 * connected UI ports to reload their window. The UI reload always runs, even when
 * repair fails, so the user is not left on an error screen with no repair listeners.
 *
 * @param options - Repair dependencies and context.
 * @param options.repairAction
 * @param options.backup
 * @param options.connectedPorts
 * @param options.initBackground
 * @param options.persistenceManager
 * @param options.setGlobalInitializers
 * @param options.setRestoreFlowType
 * @param options.tryPostMessage
 */
export async function repairStateCorruptionInPlace({
  repairAction,
  backup,
  connectedPorts,
  initBackground,
  persistenceManager,
  setGlobalInitializers,
  setRestoreFlowType,
  tryPostMessage,
}: RepairStateCorruptionInPlaceOptions): Promise<void> {
  setGlobalInitializers();

  try {
    if (
      repairAction === CriticalErrorRepairAction.Recover &&
      hasVault(backup)
    ) {
      await initBackground(backup);
      setRestoreFlowType();
    } else if (repairAction === CriticalErrorRepairAction.Reset) {
      await persistenceManager.reset();
      await initBackground(null);
    } else {
      throw new Error(
        `Unexpected state corruption repair action: ${repairAction}`,
      );
    }
  } finally {
    // Always reload UI windows, including when repair fails. Listeners were
    // already removed before this runs, so without a reload the user would be
    // stuck on the error screen unable to retry.
    for (const connectedPort of connectedPorts) {
      tryPostMessage(connectedPort, RELOAD_WINDOW);
    }
  }
}
