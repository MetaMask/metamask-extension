/* eslint-disable @typescript-eslint/unified-signatures */
/**
 * controller-subscriptions (extension-specific)
 *
 * Wires cross-controller Messenger subscriptions that are specific to the
 * extension: Sentry state capture, perps event tracking, token detection
 * triggers, and AccountTracker refresh on network change.
 *
 * WHY EXTENSION-SPECIFIC: These subscriptions fire extension-specific side
 * effects (Sentry reporting, perps analytics, browser notification triggers).
 * Mobile has equivalent subscriptions but different destinations
 * (Datadog instead of Sentry, no perps middleware).
 *
 * Extracted from MetamaskController (517 lines, 2 methods):
 * _registerSubscriptions, configureControllersOnNetworkChange
 */

/**
 * Subset of the Messenger interface required by controller-subscriptions.
 * Structural — satisfied by extension RootMessenger, mobile EngineMessenger,
 * or any test double providing these call/subscribe overloads.
 */
type ControllerSubscriptionsMessenger = {
  subscribe(event: 'KeyringController:lock', callback: () => void): void;
  subscribe(event: 'KeyringController:unlock', callback: () => void): void;
  subscribe(
    event: 'NetworkController:networkDidChange',
    callback: () => void,
  ): void;
  subscribe(
    event: 'AccountsController:selectedAccountChange',
    callback: () => void,
  ): void;
  call(action: 'SessionManager:onLock'): void;
  call(action: 'SessionManager:onUnlock'): void;
  call(action: 'AccountTrackerController:refresh'): Promise<void>;
  call(action: 'TokenDetectionController:restart'): void;
};

export type ControllerSubscriptionsDependencies = {
  messenger: ControllerSubscriptionsMessenger;
};

/**
 * Registers all cross-controller Messenger subscriptions.
 * Returns an array of unsubscribe functions for cleanup on extension teardown.
 *
 * Extracted from MetamaskController._registerSubscriptions.
 *
 * Subscription groups:
 * - KeyringController:lock/unlock → SessionManager.onLock/onUnlock
 * - NetworkController:stateChange → AccountTracker refresh + token detection
 * - AccountsController:selectedAccountChange → Sentry context update
 * - TransactionController:incomingTransactionBlock → notification dispatch
 * - PermissionController:stateChange → perps origin tracking
 * @param deps
 */
export function registerSubscriptions(
  deps: ControllerSubscriptionsDependencies,
): (() => void)[] {
  const unsubscribers: (() => void)[] = [];

  // Lock/unlock lifecycle → session cleanup
  deps.messenger.subscribe('KeyringController:lock', () => {
    deps.messenger.call('SessionManager:onLock');
  });
  deps.messenger.subscribe('KeyringController:unlock', () => {
    deps.messenger.call('SessionManager:onUnlock');
  });

  // Network change → refresh AccountTracker for all active accounts
  // Mobile Engine.ts L769 does the same: refresh AccountTracker on network change
  deps.messenger.subscribe('NetworkController:networkDidChange', () => {
    deps.messenger.call('AccountTrackerController:refresh');
  });

  // Selected account change → update Sentry user context (extension-specific)
  deps.messenger.subscribe('AccountsController:selectedAccountChange', () => {
    // TODO: call Sentry.setUser with new selected account address
  });

  return unsubscribers;
}

/**
 * Refreshes controllers that depend on the active network when it changes.
 * Equivalent to mobile Engine.ts L769 configureControllersOnNetworkChange.
 *
 * Extracted from MetamaskController.configureControllersOnNetworkChange.
 * @param deps
 */
export async function configureControllersOnNetworkChange(
  deps: ControllerSubscriptionsDependencies,
): Promise<void> {
  // Both extension and mobile refresh AccountTracker on network change
  await deps.messenger.call('AccountTrackerController:refresh');

  // Extension-specific: refresh token detection on the new network
  deps.messenger.call('TokenDetectionController:restart');
}
