import { Messenger } from '@metamask/messenger';
import type { AssetsControllerMessenger as AssetsControllerMessengerType } from '@metamask/assets-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import {
  NetworkEnablementControllerGetStateAction,
  NetworkEnablementControllerEvents,
} from '@metamask/network-enablement-controller';
import {
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { RootMessenger } from '../../../lib/messenger';

// Re-export the messenger type from the package
export type AssetsControllerMessenger = AssetsControllerMessengerType;

/**
 * App lifecycle event: fired when app becomes active (opened/foregrounded)
 */
type AppStateControllerAppOpenedEvent = {
  type: 'AppStateController:appOpened';
  payload: [];
};

/**
 * App lifecycle event: fired when app becomes inactive (closed/backgrounded)
 */
type AppStateControllerAppClosedEvent = {
  type: 'AppStateController:appClosed';
  payload: [];
};

/**
 * Actions that the AssetsController needs to call
 */
type AllowedActions =
  | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
  | NetworkEnablementControllerGetStateAction;

/**
 * Events that the AssetsController subscribes to
 */
type AllowedEvents =
  | AccountTreeControllerSelectedAccountGroupChangeEvent
  | NetworkEnablementControllerEvents
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent
  | AppStateControllerAppOpenedEvent
  | AppStateControllerAppClosedEvent;

export type AssetsControllerInitMessenger = ReturnType<
  typeof getAssetsControllerInitMessenger
>;

/**
 * Get a messenger for the AssetsController.
 * The AssetsController uses the @metamask/messenger pattern and requires a child messenger
 * with the 'AssetsController' namespace.
 *
 * @param messenger - The root controller messenger.
 * @returns The controller messenger.
 */
export function getAssetsControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): AssetsControllerMessenger {
  const controllerMessenger = new Messenger<
    'AssetsController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'AssetsController',
    parent: messenger,
  });

  // Delegate the allowed actions and events that the controller needs to call
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      'NetworkEnablementController:getState',
    ],
    events: [
      'AccountTreeController:selectedAccountGroupChange',
      'NetworkEnablementController:stateChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      'AppStateController:appOpened',
      'AppStateController:appClosed',
    ],
  });

  return controllerMessenger as unknown as AssetsControllerMessenger;
}

/**
 * Get a restricted messenger for AssetsController initialization.
 * This is scoped to actions and events needed during initialization.
 *
 * @param messenger - The root controller messenger.
 * @returns The restricted initialization messenger.
 */
export function getAssetsControllerInitMessenger(
  messenger: RootMessenger<never, never>,
) {
  const initMessenger = new Messenger<
    'AssetsControllerInit',
    never,
    never,
    typeof messenger
  >({
    namespace: 'AssetsControllerInit',
    parent: messenger,
  });

  return initMessenger;
}
