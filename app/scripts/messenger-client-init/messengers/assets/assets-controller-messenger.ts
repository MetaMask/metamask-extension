import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { AssetsControllerMessenger } from '@metamask/assets-controller';
import type { SnapControllerHandleRequestAction } from '@metamask/snaps-controllers';
import { AuthenticationControllerGetBearerTokenAction } from '@metamask/profile-sync-controller/auth';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
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
 * Actions delegated to the AssetsController messenger.
 */
export const ASSETS_CONTROLLER_DELEGATED_ACTIONS = [
  'AccountTreeController:getAccountsFromSelectedAccountGroup',
  'AccountTreeController:isInitialized',
  'ClientController:getState',
  'KeyringController:isUnlocked',
  'ConfigRegistryController:getNetworkConfigByCaip2ChainId',
  'NetworkEnablementController:getState',
  'NetworkController:getState',
  'NetworkController:getNetworkClientById',
  'AccountsController:getSelectedAccount',
  'SnapController:handleRequest',
  'SnapController:getRunnableSnaps',
  'PermissionController:getPermissions',
  'PhishingController:bulkScanTokens',
  'RemoteFeatureFlagController:getState',
] as const;

/**
 * Events delegated to the AssetsController messenger.
 */
export const ASSETS_CONTROLLER_DELEGATED_EVENTS = [
  'AccountTreeController:selectedAccountGroupChange',
  'AccountTreeController:initialized',
  'AccountTreeController:uninitialized',
  'NetworkEnablementController:stateChange',
  'ClientController:stateChange',
  'KeyringController:lock',
  'KeyringController:unlock',
  'NetworkController:networkDidChange',
  'NetworkController:networkAdded',
  'NetworkController:networkRemoved',
  'NetworkController:stateChange',
  'AccountsController:accountBalancesUpdated',
  'PermissionController:stateChange',
  'SnapController:snapInstalled',
  'PreferencesController:stateChange',
  'TransactionController:transactionConfirmed',
  'TransactionController:unapprovedTransactionAdded',
  'AccountActivityService:balanceUpdated',
  'AccountActivityService:statusChanged',
  'RemoteFeatureFlagController:stateChange',
] as const;

/**
 * Actions delegated to the AssetsController initialization messenger.
 */
export const ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS = [
  'AuthenticationController:getBearerToken',
  'SnapController:handleRequest',
  'PreferencesController:getState',
  'OnboardingController:getState',
  'RemoteFeatureFlagController:getState',
] as const;

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
    actions: [...ASSETS_CONTROLLER_DELEGATED_ACTIONS],
    events: [...ASSETS_CONTROLLER_DELEGATED_EVENTS],
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
  | OnboardingControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

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
    actions: [...ASSETS_CONTROLLER_INIT_DELEGATED_ACTIONS],
    events: ['OnboardingController:stateChange'],
  });

  return initMessenger;
}
