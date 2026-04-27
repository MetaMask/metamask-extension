import { Messenger } from '@metamask/messenger';
import type { AssetsControllerMessenger as AssetsControllerMessengerType } from '@metamask/assets-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
  AccountTreeControllerStateChangeEvent,
} from '@metamask/account-tree-controller';
import { PhishingControllerBulkScanTokensAction } from '@metamask/phishing-controller';
import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import {
  NetworkEnablementControllerGetStateAction,
  NetworkEnablementControllerEvents,
} from '@metamask/network-enablement-controller';
import type { ClientControllerStateChangeEvent } from '@metamask/client-controller';
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
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerIncomingTransactionsReceivedEvent,
  TransactionControllerUnapprovedTransactionAddedEvent,
} from '@metamask/transaction-controller';
import type { PreferencesControllerStateChangeEvent } from '@metamask/preferences-controller';
import type {
  GetPermissions,
  PermissionControllerStateChange,
} from '@metamask/permission-controller';
import type {
  SnapControllerGetRunnableSnapsAction,
  SnapControllerHandleRequestAction,
} from '@metamask/snaps-controllers';
import { AuthenticationControllerGetBearerTokenAction } from '@metamask/profile-sync-controller/auth';
import {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../../controllers/onboarding';
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
  | ClientControllerStateChangeEvent
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
type RpcDataSourceEvents =
  | NetworkControllerStateChangeEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerIncomingTransactionsReceivedEvent
  | TransactionControllerUnapprovedTransactionAddedEvent;

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
  | SnapControllerGetRunnableSnapsAction
  | SnapControllerHandleRequestAction
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
  | BackendWebsocketDataSourceActions
  | SnapDataSourceActions
  | PhishingControllerBulkScanTokensAction
  | AccountsControllerGetSelectedAccountAction;
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
  | SnapDataSourceEvents
  | PreferencesControllerStateChangeEvent
  | AccountTreeControllerStateChangeEvent;
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
      'BackendWebSocketService:subscribe',
      'BackendWebSocketService:getConnectionInfo',
      'BackendWebSocketService:findSubscriptionsByChannelPrefix',
      'SnapController:handleRequest',
      'SnapController:getRunnableSnaps',
      'PermissionController:getPermissions',
      'PhishingController:bulkScanTokens',
      'AccountsController:getSelectedAccount',
    ],
    events: [
      'AccountTreeController:selectedAccountGroupChange',
      'ClientController:stateChange',
      'NetworkEnablementController:stateChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      'NetworkController:stateChange',
      'BackendWebSocketService:connectionStateChanged',
      'AccountsController:accountBalancesUpdated',
      'PermissionController:stateChange',
      'PreferencesController:stateChange',
      'AccountTreeController:stateChange',
      'TransactionController:transactionConfirmed',
      'TransactionController:incomingTransactionsReceived',
      'TransactionController:unapprovedTransactionAdded',
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
  | AuthenticationControllerGetBearerTokenAction
  | SnapControllerHandleRequestAction
  | PreferencesControllerGetStateAction
  | OnboardingControllerGetStateAction;

/**
 * Events needed during AssetsController initialization.
 */
type AllowedInitializationEvents = OnboardingControllerStateChangeEvent;

/**
 * Get a restricted messenger for AssetsController initialization.
 * This is scoped to actions and events needed during initialization.
 *
 * @param messenger - The root controller messenger.
 * @returns The restricted initialization messenger.
 */
export function getAssetsControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const initMessenger = new Messenger<
    'AssetsControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
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
      'OnboardingController:getState',
    ],
    events: ['OnboardingController:stateChange'],
  });

  return initMessenger;
}
