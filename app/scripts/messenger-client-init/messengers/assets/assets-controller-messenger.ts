import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { AssetsControllerMessenger } from '@metamask/assets-controller';
import type { SnapControllerHandleRequestAction } from '@metamask/snaps-controllers';
import { AuthenticationControllerGetBearerTokenAction } from '@metamask/profile-sync-controller/auth';
import {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../../controllers/onboarding';
import { RootMessenger } from '../../../lib/messenger';
import type { PreferencesControllerGetStateAction } from '../../../controllers/preferences-controller';

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
  messenger: RootMessenger<
    MessengerActions<AssetsControllerMessenger>,
    MessengerEvents<AssetsControllerMessenger>
  >,
): AssetsControllerMessenger {
  const controllerMessenger: AssetsControllerMessenger = new Messenger({
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
      'NetworkController:networkRemoved',
      'NetworkController:networkAdded',
      'BackendWebSocketService:connectionStateChanged',
      'AccountsController:accountBalancesUpdated',
      'PermissionController:stateChange',
      'SnapController:snapInstalled',
      'PreferencesController:stateChange',
      'AccountTreeController:stateChange',
      'TransactionController:transactionConfirmed',
      'TransactionController:incomingTransactionsReceived',
      'TransactionController:unapprovedTransactionAdded',
    ],
  });

  return controllerMessenger;
}

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
