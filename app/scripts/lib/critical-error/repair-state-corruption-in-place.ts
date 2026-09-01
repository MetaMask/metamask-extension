import { RELOAD_WINDOW } from '../../../../shared/constants/start-up-errors';
import { CriticalErrorRepairAction } from '../../../../shared/constants/critical-error';
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
  /**
   * Resolves when background initialization has completed, or rejects when it
   * has failed. Pass the current `isInitialized` promise created by
   * `setGlobalInitializers`. The real `initBackground` catches initialize
   * errors and rejects that promise instead of throwing.
   */
  backgroundIsInitialized: () => Promise<void>;
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
 * connected UI ports to reload their window. The UI reload always runs after a
 * repair attempt starts, even when initialization fails, so the user is not left
 * on the error screen with no repair listeners.
 *
 * Reset persistence work runs before replacing the initializer so a failed
 * reset does not replace `isInitialized` with a promise that never settles.
 *
 * @param options - Repair dependencies and context.
 * @param options.repairAction
 * @param options.backup
 * @param options.connectedPorts
 * @param options.initBackground
 * @param options.backgroundIsInitialized
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
  backgroundIsInitialized,
  persistenceManager,
  setGlobalInitializers,
  setRestoreFlowType,
  tryPostMessage,
}: RepairStateCorruptionInPlaceOptions): Promise<void> {
  const canRecover =
    repairAction === CriticalErrorRepairAction.Recover && hasVault(backup);
  const shouldReset = repairAction === CriticalErrorRepairAction.Reset;

  try {
    if (!canRecover && !shouldReset) {
      throw new Error(
        `Unexpected state corruption repair action: ${repairAction}`,
      );
    }

    if (shouldReset) {
      await persistenceManager.reset();
    }

    setGlobalInitializers();
    await initBackground(canRecover ? backup : null);
    await backgroundIsInitialized();
    if (canRecover) {
      setRestoreFlowType();
    }
  } finally {
    // Always reload UI windows after a repair attempt starts. Listeners were
    // already removed before this runs, so without a reload the user would be
    // stuck on the error screen unable to retry.
    for (const connectedPort of connectedPorts) {
      tryPostMessage(connectedPort, RELOAD_WINDOW);
    }
  }
}
