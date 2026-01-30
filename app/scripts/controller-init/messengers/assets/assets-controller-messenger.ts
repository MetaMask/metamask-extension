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
import type { NetworkControllerStateChangeEvent } from '@metamask/network-controller';
import type {
  BackendWebSocketServiceActions,
  BackendWebSocketServiceEvents,
} from '@metamask/core-backend';
import { AuthenticationControllerGetBearerToken } from '@metamask/profile-sync-controller/auth';
import { RootMessenger } from '../../../lib/messenger';

// Re-export the messenger type from the package
export type AssetsControllerMessenger = AssetsControllerMessengerType;

/**
 * NetworkController:getState action
 */
type NetworkControllerGetStateAction = {
  type: 'NetworkController:getState';
  handler: () => unknown;
};

/**
 * NetworkController:getNetworkClientById action
 */
type NetworkControllerGetNetworkClientByIdAction = {
  type: 'NetworkController:getNetworkClientById';
  handler: (networkClientId: string) => unknown;
};

/**
 * TokenListController:getState action
 */
type TokenListControllerGetStateAction = {
  type: 'TokenListController:getState';
  handler: () => unknown;
};

/**
 * SnapController:handleRequest action for SnapDataSource
 */
type SnapControllerHandleRequestAction = {
  type: 'SnapController:handleRequest';
  handler: (args: {
    snapId: string;
    origin: string;
    handler: string;
    request: unknown;
  }) => Promise<unknown>;
};

/**
 * SnapController:getRunnableSnaps action to get runnable snaps for keyring discovery
 */
type SnapControllerGetRunnableSnapsAction = {
  type: 'SnapController:getRunnableSnaps';
  handler: () => Array<{ id: string; version: string }>;
};

/**
 * PermissionController:getPermissions action for dynamic snap discovery
 */
type PermissionControllerGetPermissionsAction = {
  type: 'PermissionController:getPermissions';
  handler: (origin: string) => unknown;
};

/**
 * PermissionController:stateChange event for runtime snap discovery
 */
type PermissionControllerStateChangeEvent = {
  type: 'PermissionController:stateChange';
  payload: [{ subjects: Record<string, unknown> }, unknown[]];
};

/**
 * AccountsController:accountBalancesUpdated event for snap keyring balance updates
 */
type AccountsControllerAccountBalancesUpdatedEvent = {
  type: 'AccountsController:accountBalancesUpdated';
  payload: [{ accountId: string; balances: Record<string, unknown> }];
};

/**
 * Actions that the AssetsController needs to call
 */
type AllowedActions =
  | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
  | NetworkEnablementControllerGetStateAction
  // Data source dependencies
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | TokenListControllerGetStateAction
  | BackendWebSocketServiceActions
  | SnapControllerHandleRequestAction
  | SnapControllerGetRunnableSnapsAction
  | PermissionControllerGetPermissionsAction;

/**
 * Events that the AssetsController subscribes to
 */
type AllowedEvents =
  | AccountTreeControllerSelectedAccountGroupChangeEvent
  | NetworkEnablementControllerEvents
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent
  // Data source dependencies
  | NetworkControllerStateChangeEvent
  | BackendWebSocketServiceEvents
  // SnapDataSource: runtime snap discovery and balance updates
  | PermissionControllerStateChangeEvent
  | AccountsControllerAccountBalancesUpdatedEvent;

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
  console.log('[AssetsController] Creating AssetsController messenger...');

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
      // Core AssetsController dependencies
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      'NetworkEnablementController:getState',
      // Data source dependencies - NetworkController
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      // Data source dependencies - TokenListController
      'TokenListController:getState',
      // Data source dependencies - BackendWebSocketService
      'BackendWebSocketService:subscribe',
      'BackendWebSocketService:getConnectionInfo',
      'BackendWebSocketService:findSubscriptionsByChannelPrefix',
      // Data source dependencies - SnapController (for dynamic snap discovery)
      'SnapController:handleRequest',
      'SnapController:getRunnableSnaps',
      // Data source dependencies - PermissionController (for dynamic snap discovery)
      'PermissionController:getPermissions',
    ],
    events: [
      // Core AssetsController events
      'AccountTreeController:selectedAccountGroupChange',
      'NetworkEnablementController:stateChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      // Data source events
      'NetworkController:stateChange',
      'BackendWebSocketService:connectionStateChanged',
      // SnapDataSource: runtime snap discovery and balance updates
      'PermissionController:stateChange',
      'AccountsController:accountBalancesUpdated',
    ],
  });

  return controllerMessenger as unknown as AssetsControllerMessenger;
}

/**
 * Actions needed during AssetsController initialization
 */
type AllowedInitializationActions =
  | AuthenticationControllerGetBearerToken
  | SnapControllerHandleRequestAction
  | SnapControllerGetRunnableSnapsAction
  | PermissionControllerGetPermissionsAction;

/**
 * Get a restricted messenger for AssetsController initialization.
 * This is scoped to actions and events needed during initialization.
 *
 * @param messenger - The root controller messenger.
 * @returns The restricted initialization messenger.
 */
export function getAssetsControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const initMessenger = new Messenger<
    'AssetsControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'AssetsControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: initMessenger,
    actions: [
      'AuthenticationController:getBearerToken',
      'SnapController:handleRequest',
      'SnapController:getRunnableSnaps',
      'PermissionController:getPermissions',
    ],
  });

  return initMessenger;
}
