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
import type {
  GetPermissions,
  PermissionControllerStateChange,
} from '@metamask/permission-controller';
import type {
  GetRunnableSnaps,
  HandleSnapRequest,
} from '@metamask/snaps-controllers';
import { AuthenticationControllerGetBearerToken } from '@metamask/profile-sync-controller/auth';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Re-export the messenger type from the package.
 */
export type AssetsControllerMessenger = AssetsControllerMessengerType;

/**
 * Actions that the AssetsController core needs to call.
 * These are used directly by the AssetsController itself.
 */
type CoreAssetsControllerActions =
  | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
  | NetworkEnablementControllerGetStateAction;

/**
 * Events that the AssetsController core subscribes to.
 * These are used directly by the AssetsController itself.
 */
type CoreAssetsControllerEvents =
  | AccountTreeControllerSelectedAccountGroupChangeEvent
  | NetworkEnablementControllerEvents
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent;

/**
 * NetworkController:getState action for RpcDataSource.
 */
type NetworkControllerGetStateAction = {
  type: 'NetworkController:getState';
  handler: () => unknown;
};

/**
 * NetworkController:getNetworkClientById action for RpcDataSource.
 */
type NetworkControllerGetNetworkClientByIdAction = {
  type: 'NetworkController:getNetworkClientById';
  handler: (networkClientId: string) => unknown;
};

/**
 * Actions required by RpcDataSource.
 *
 * @see RpcDataSource in @metamask/assets-controller
 */
type RpcDataSourceActions =
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction;

/**
 * Events required by RpcDataSource.
 *
 * @see RpcDataSource in @metamask/assets-controller
 */
type RpcDataSourceEvents = NetworkControllerStateChangeEvent;

/**
 * TokenListController:getState action for TokenDataSource.
 */
type TokenListControllerGetStateAction = {
  type: 'TokenListController:getState';
  handler: () => unknown;
};

/**
 * Actions required by TokenDataSource.
 *
 * @see TokenDataSource in @metamask/assets-controller
 */
type TokenDataSourceActions = TokenListControllerGetStateAction;

/**
 * Actions required by BackendWebsocketDataSource.
 *
 * @see BackendWebsocketDataSource in @metamask/assets-controller
 */
type BackendWebsocketDataSourceActions = BackendWebSocketServiceActions;

/**
 * Events required by BackendWebsocketDataSource.
 *
 * @see BackendWebsocketDataSource in @metamask/assets-controller
 */
type BackendWebsocketDataSourceEvents = BackendWebSocketServiceEvents;

/**
 * AccountsController:accountBalancesUpdated event for SnapDataSource.
 * Re-published from SnapKeyring:accountBalancesUpdated.
 */
type AccountsControllerAccountBalancesUpdatedEvent = {
  type: 'AccountsController:accountBalancesUpdated';
  payload: [
    {
      balances: {
        [accountId: string]: {
          [assetId: string]: {
            amount: string;
            unit: string;
          };
        };
      };
    },
  ];
};

/**
 * Actions required by SnapDataSource.
 *
 * @see SnapDataSource in @metamask/assets-controller
 */
type SnapDataSourceActions =
  | GetRunnableSnaps
  | HandleSnapRequest
  | GetPermissions;

/**
 * Events required by SnapDataSource.
 *
 * @see SnapDataSource in @metamask/assets-controller
 */
type SnapDataSourceEvents =
  | AccountsControllerAccountBalancesUpdatedEvent
  | PermissionControllerStateChange;

/**
 * All actions allowed for the AssetsController messenger.
 * Includes core controller actions and all data source actions.
 *
 * Note: Data source actions are included because the package creates data sources
 * internally using the controller's messenger. When the package supports separate
 * data source messengers, these should be decoupled.
 */
type AllowedActions =
  | CoreAssetsControllerActions
  | RpcDataSourceActions
  | TokenDataSourceActions
  | BackendWebsocketDataSourceActions
  | SnapDataSourceActions;

/**
 * All events allowed for the AssetsController messenger.
 * Includes core controller events and all data source events.
 *
 * Note: Data source events are included because the package creates data sources
 * internally using the controller's messenger. When the package supports separate
 * data source messengers, these should be decoupled.
 */
type AllowedEvents =
  | CoreAssetsControllerEvents
  | RpcDataSourceEvents
  | BackendWebsocketDataSourceEvents
  | SnapDataSourceEvents;

/**
 * Messenger type for AssetsController initialization.
 */
export type AssetsControllerInitMessenger = ReturnType<
  typeof getAssetsControllerInitMessenger
>;

/**
 * Get a messenger for the AssetsController.
 *
 * The AssetsController uses the messenger pattern and requires a child messenger
 * with the 'AssetsController' namespace.
 *
 * Note: Currently includes data source dependencies because the package creates
 * data sources internally using the controller's messenger. When the package
 * supports separate data source messengers, these should be decoupled.
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

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      'NetworkEnablementController:getState',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'TokenListController:getState',
      'BackendWebSocketService:subscribe',
      'BackendWebSocketService:getConnectionInfo',
      'BackendWebSocketService:findSubscriptionsByChannelPrefix',
      'SnapController:handleRequest',
      'SnapController:getRunnableSnaps',
      'PermissionController:getPermissions',
    ],
    events: [
      'AccountTreeController:selectedAccountGroupChange',
      'NetworkEnablementController:stateChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      'NetworkController:stateChange',
      'BackendWebSocketService:connectionStateChanged',
      'AccountsController:accountBalancesUpdated',
      'PermissionController:stateChange',
    ],
  });

  return controllerMessenger as unknown as AssetsControllerMessenger;
}

/**
 * PreferencesController:getState action.
 */
type PreferencesControllerGetStateAction = {
  type: 'PreferencesController:getState';
  handler: () => { useTokenDetection: boolean; [key: string]: unknown };
};

/**
 * Actions needed during AssetsController initialization.
 */
type AllowedInitializationActions =
  | AuthenticationControllerGetBearerToken
  | HandleSnapRequest
  | PreferencesControllerGetStateAction;

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
      'PreferencesController:getState',
    ],
  });

  return initMessenger;
}
