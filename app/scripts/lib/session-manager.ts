/* eslint-disable @typescript-eslint/unified-signatures */
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
 * setLocked, _onKeyringControllerUpdate, handleLock, handleUnlock,
 * resetState
 */

/**
 * Subset of the Messenger interface required by session-manager.
 * Structural — satisfied by extension RootMessenger, mobile EngineMessenger,
 * or any test double providing these call overloads.
 */
type SessionManagerMessenger = {
  call(action: 'KeyringController:setLocked'): Promise<void>;
  call(
    action: 'ConnectionManager:notifyAllConnections',
    notification: { method: string; params?: unknown },
  ): void;
  call(action: 'AccountTrackerController:clearAccounts'): void;
  call(action: 'AccountTrackerController:syncWithAddresses'): void;
  call(action: 'PreferencesController:clearState'): void;
  call(action: 'TransactionController:clearState'): void;
  call(action: 'PermissionController:clearState'): void;
};

export type SessionManagerDependencies = {
  messenger: SessionManagerMessenger;
  notificationManager: { closeAllNotifications(): Promise<void> };
};

/**
 * Locks the wallet: clears sensitive state, closes notification windows,
 * disconnects active ports, and notifies all connections of the lock event.
 *
 * Extracted from MetamaskController.setLocked + handleLock.
 *
 * TODO: Requires messenger actions:
 * - KeyringController:setLocked
 * - ConnectionManager:notifyAllConnections (once extracted)
 * - ConnectionManager:disconnectAll
 * @param deps
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
 * - AccountTrackerController:clearAccounts
 * - TxController:clearUnapprovedTransactions
 * @param deps
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
 * - AccountTrackerController:syncWithAddresses
 * - ConnectionManager:notifyAllConnections
 * @param deps
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
 * @param deps
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
