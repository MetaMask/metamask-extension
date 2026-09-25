import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { AccountTreeControllerMessenger } from '@metamask/account-tree-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the account tree controller. This is scoped to the
 * actions and events that this controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getAccountTreeControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AccountTreeControllerMessenger>,
    MessengerEvents<AccountTreeControllerMessenger>
  >,
) {
  const accountTreeControllerMessenger: AccountTreeControllerMessenger =
    new Messenger({
      namespace: 'AccountTreeController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: accountTreeControllerMessenger,
    events: [
      'AccountsController:accountsAdded',
      'AccountsController:accountsRemoved',
      'AccountsController:selectedAccountChange',
      'UserStorageController:stateChange',
      'MultichainAccountService:walletStatusChange',
    ],
    actions: [
      'AccountsController:listMultichainAccounts',
      'AccountsController:getAccount',
      'AccountsController:getAccounts',
      'AccountsController:getSelectedMultichainAccount',
      'AccountsController:setSelectedAccount',
      'UserStorageController:getState',
      'UserStorageController:performGetStorage',
      'UserStorageController:performGetStorageAllFeatureEntries',
      'UserStorageController:performSetStorage',
      'UserStorageController:performBatchSetStorage',
      'AuthenticationController:getSessionProfile',
      'MultichainAccountService:createMultichainAccountGroup',
      'MultichainAccountService:createMultichainAccountGroups',
      'MultichainAccountService:createMultichainAccountWallet',
      'MultichainAccountService:removeMultichainAccountWallet',
      'KeyringController:verifyPassword',
      'KeyringController:removeAccount',
      'KeyringController:withController',
      'KeyringController:withKeyringV2',
      'KeyringController:withKeyringV2Unsafe',
      'SnapController:getSnap',
      'KeyringController:getState',
    ],
  });
  return accountTreeControllerMessenger;
}
