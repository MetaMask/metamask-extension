import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerGetAccountAction,
  AccountsControllerGetSelectedMultichainAccountAction,
  AccountsControllerListMultichainAccountsAction,
  AccountsControllerSelectedAccountChangeEvent,
  AccountsControllerSetSelectedAccountAction,
} from '@metamask/accounts-controller';
import { Messenger } from '@metamask/messenger';
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
import { RootMessenger } from '../../../lib/messenger';
import { AccountOrderControllerGetStateAction } from '../../../controllers/account-order';

type Actions =
  | AccountsControllerGetAccountAction
  | AccountsControllerGetSelectedMultichainAccountAction
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
  | MultichainAccountServiceCreateMultichainAccountGroupAction;

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
  messenger: RootMessenger<Actions, Events>,
) {
  const accountTreeControllerMessenger = new Messenger<
    'AccountTreeController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'AccountTreeController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: accountTreeControllerMessenger,
    events: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:selectedAccountChange',
      'UserStorageController:stateChange',
      'MultichainAccountService:walletStatusChange',
    ],
    actions: [
      'AccountsController:listMultichainAccounts',
      'AccountsController:getAccount',
      'AccountsController:getSelectedMultichainAccount',
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
  return accountTreeControllerMessenger;
}

export type AllowedInitializationActions =
  | MetaMetricsControllerTrackEventAction
  | AccountsControllerGetAccountAction
  | AccountOrderControllerGetStateAction;

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
  messenger: RootMessenger<AllowedInitializationActions, Events>,
) {
  const accountTreeControllerInitMessenger = new Messenger<
    'AccountTreeControllerInit',
    AllowedInitializationActions,
    Events,
    typeof messenger
  >({
    namespace: 'AccountTreeControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: accountTreeControllerInitMessenger,
    actions: [
      'MetaMetricsController:trackEvent',
      'AccountsController:getAccount',
      'AccountOrderController:getState',
    ],
    events: [],
  });
  return accountTreeControllerInitMessenger;
}
