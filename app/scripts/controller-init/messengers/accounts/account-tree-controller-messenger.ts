import { Messenger } from '@metamask/base-controller';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerAccountRenamedEvent,
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
import { MultichainAccountServiceCreateMultichainAccountGroupAction } from '@metamask/multichain-account-service';

type Actions =
  | AccountsControllerGetAccountAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerSetSelectedAccountAction
  | AccountsControllerListMultichainAccountsAction
  | SnapControllerGet
  | KeyringControllerGetStateAction
  | UserStorageController.UserStorageControllerPerformGetStorage
  | UserStorageController.UserStorageControllerPerformGetStorageAllFeatureEntries
  | UserStorageController.UserStorageControllerPerformSetStorage
  | UserStorageController.UserStorageControllerPerformBatchSetStorage
  | AuthenticationController.AuthenticationControllerGetSessionProfile
  | MultichainAccountServiceCreateMultichainAccountGroupAction;

type Events =
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRenamedEvent
  | AccountsControllerAccountRemovedEvent
  | AccountsControllerSelectedAccountChangeEvent;

export type AccountTreeControllerMessenger = ReturnType<
  typeof getAccountTreeControllerMessenger
>;

/**
 * Get a restricted messenger for the account wallet controller. This is scoped to the
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
      'AccountsController:accountRenamed',
      'AccountsController:accountRemoved',
      'AccountsController:selectedAccountChange',
    ],
    allowedActions: [
      'AccountsController:listMultichainAccounts',
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
      'AccountsController:setSelectedAccount',
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

/**
 * Get a restricted messenger for the account wallet controller. This is scoped to the
 * actions and events that this controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getAccountTreeControllerInitMessenger(
  messenger: Messenger<Actions, Events>,
) {
  // Our `init` method needs the same actions, so just re-use the same messenger
  // function here.
  return getAccountTreeControllerMessenger(messenger);
}
