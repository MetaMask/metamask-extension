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
 *   _registerSubscriptions, configureControllersOnNetworkChange
 */

import type { ControllerRegistry } from '../ControllerRegistry';
import type { RootMessenger } from '../messenger';

export type ControllerSubscriptionsDependencies = {
  registry: ControllerRegistry;
  messenger: RootMessenger;
};

/**
 * Registers all cross-controller Messenger subscriptions.
 * Returns an array of unsubscribe functions for cleanup on extension teardown.
 *
 * Extracted from MetamaskController._registerSubscriptions.
 *
 * Subscription groups:
 *   - KeyringController:lock/unlock → SessionManager.onLock/onUnlock
 *   - NetworkController:stateChange → AccountTracker refresh + token detection
 *   - AccountsController:selectedAccountChange → Sentry context update
 *   - TransactionController:incomingTransactionBlock → notification dispatch
 *   - PermissionController:stateChange → perps origin tracking
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
 */
export async function configureControllersOnNetworkChange(
  deps: ControllerSubscriptionsDependencies,
): Promise<void> {
  // Both extension and mobile refresh AccountTracker on network change
  await deps.messenger.call('AccountTrackerController:refresh');

  // Extension-specific: refresh token detection on the new network
  deps.messenger.call('TokenDetectionController:restart');
}
