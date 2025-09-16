import { Messenger } from '@metamask/base-controller';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerGetAccountAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerListMultichainAccountsAction,
  AccountsControllerSelectedAccountChangeEvent,
  AccountsControllerSetSelectedAccountAction,
} from '@metamask/accounts-controller';
import {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
import { GetSnap as SnapControllerGet } from '@metamask/snaps-controllers';
import { KeyringControllerGetStateAction } from '@metamask/keyring-controller';
import {
  MultichainAccountServiceCreateMultichainAccountGroupAction,
  MultichainAccountServiceWalletStatusChangeEvent,
} from '@metamask/multichain-account-service';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';

type Actions =
  | AccountsControllerGetAccountAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerSetSelectedAccountAction
  | AccountsControllerListMultichainAccountsAction
  | SnapControllerGet
  | KeyringControllerGetStateAction
  | UserStorageController.UserStorageControllerGetStateAction
  | UserStorageController.UserStorageControllerPerformGetStorage
  | UserStorageController.UserStorageControllerPerformGetStorageAllFeatureEntries
  | UserStorageController.UserStorageControllerPerformSetStorage
  | UserStorageController.UserStorageControllerPerformBatchSetStorage
  | AuthenticationController.AuthenticationControllerGetSessionProfile
  | MultichainAccountServiceCreateMultichainAccountGroupAction
  | MetaMetricsControllerTrackEventAction;

type Events =
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent
  | AccountsControllerSelectedAccountChangeEvent
  | UserStorageController.UserStorageControllerStateChangeEvent
  | MultichainAccountServiceWalletStatusChangeEvent;

export type AccountTreeControllerMessenger = ReturnType<
  typeof getAccountTreeControllerMessenger
>;

/**
 * Get a restricted messenger for the account tree controller. This is scoped to the
 * actions and events that this controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getAccountTreeControllerMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'AccountTreeController',
    allowedEvents: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:selectedAccountChange',
      'UserStorageController:stateChange',
      'MultichainAccountService:walletStatusChange',
    ],
    allowedActions: [
      'AccountsController:listMultichainAccounts',
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
      'AccountsController:setSelectedAccount',
      'UserStorageController:getState',
      'UserStorageController:performGetStorage',
      'UserStorageController:performGetStorageAllFeatureEntries',
      'UserStorageController:performSetStorage',
      'UserStorageController:performBatchSetStorage',
      'AuthenticationController:getSessionProfile',
      'MultichainAccountService:createMultichainAccountGroup',
      'SnapController:get',
      'KeyringController:getState',
    ],
  });
}

export type AllowedInitializationActions =
  MetaMetricsControllerTrackEventAction;

export type AccountTreeControllerInitMessenger = ReturnType<
  typeof getAccountTreeControllerInitMessenger
>;

/**
 * Get a restricted messenger for the account tree controller. This is scoped to the
 * actions and events that this controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getAccountTreeControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, Events>,
) {
  return messenger.getRestricted({
    name: 'AccountTreeControllerInit',
    allowedActions: ['MetaMetricsController:trackEvent'],
    allowedEvents: [],
  });
}
