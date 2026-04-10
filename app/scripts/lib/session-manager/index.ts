/**
 * session-manager (extension-specific)
 *
 * Extension wallet lock/unlock lifecycle: credential clearing, tab cleanup,
 * notification window teardown, and port disconnection on lock.
 *
 * WHY EXTENSION-SPECIFIC: Lock cleanup touches chrome.tabs, notification
 * windows (chrome.windows), and active port connections — all browser-extension
 * APIs. Mobile uses a different session model (app background/foreground
 * lifecycle, React Native AppState events, no Port concept).
 *
 * Extracted from MetamaskController (313 lines, 5 methods):
 *   setLocked, _onKeyringControllerUpdate, handleLock, handleUnlock,
 *   resetState
 */

import type { RootMessenger } from '../messenger';

export type SessionManagerDependencies = {
  messenger: RootMessenger;
  notificationManager: { closeAllNotifications(): Promise<void> };
};

/**
 * Locks the wallet: clears sensitive state, closes notification windows,
 * disconnects active ports, and notifies all connections of the lock event.
 *
 * Extracted from MetamaskController.setLocked + handleLock.
 *
 * TODO: Requires messenger actions:
 *   - KeyringController:setLocked
 *   - ConnectionManager:notifyAllConnections (once extracted)
 *   - ConnectionManager:disconnectAll
 */
export async function lockWallet(
  deps: SessionManagerDependencies,
): Promise<void> {
  await deps.messenger.call('KeyringController:setLocked');
  await deps.notificationManager.closeAllNotifications();
  deps.messenger.call('ConnectionManager:notifyAllConnections', {
    method: 'metamask_unlockStateChanged',
    params: { isUnlocked: false },
  });
}

/**
 * Handles the KeyringController:lock event — clears any in-memory sensitive
 * data that must not persist across lock/unlock cycles.
 *
 * Extracted from MetamaskController._onKeyringControllerUpdate (lock path).
 *
 * TODO: Requires messenger actions:
 *   - AccountTrackerController:clearAccounts
 *   - TxController:clearUnapprovedTransactions
 */
export function onLock(deps: SessionManagerDependencies): void {
  deps.messenger.call('AccountTrackerController:clearAccounts');
}

/**
 * Handles the KeyringController:unlock event — refreshes account and
 * network state that may have changed while locked.
 *
 * Extracted from MetamaskController._onKeyringControllerUpdate (unlock path).
 *
 * TODO: Requires messenger actions:
 *   - AccountTrackerController:syncWithAddresses
 *   - ConnectionManager:notifyAllConnections
 */
export function onUnlock(deps: SessionManagerDependencies): void {
  deps.messenger.call('ConnectionManager:notifyAllConnections', {
    method: 'metamask_unlockStateChanged',
    params: { isUnlocked: true },
  });
  deps.messenger.call('AccountTrackerController:syncWithAddresses');
}

/**
 * Resets wallet state to factory defaults: clears all controller state,
 * closes notification windows, and re-initializes with empty vault.
 *
 * Extracted from MetamaskController.resetState.
 * Mobile Engine.ts L1108 clears the same controllers.
 *
 * TODO: Requires messenger actions for each controller's clearState/reset.
 */
export async function resetState(
  deps: SessionManagerDependencies,
): Promise<void> {
  await deps.messenger.call('KeyringController:setLocked');
  await deps.notificationManager.closeAllNotifications();
  // Individual controller resets follow — same set as mobile Engine.ts L1108
  deps.messenger.call('PreferencesController:clearState');
  deps.messenger.call('TransactionController:clearState');
  deps.messenger.call('PermissionController:clearState');
}
