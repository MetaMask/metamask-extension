import { AccountsControllerGetAccountAction } from '@metamask/accounts-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { AccountTreeControllerMessenger } from '@metamask/account-tree-controller';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller-method-action-types';
import { RootMessenger } from '../../../lib/messenger';
import { AccountOrderControllerGetStateAction } from '../../../controllers/account-order';

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
      'SnapController:getSnap',
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
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const accountTreeControllerInitMessenger = new Messenger<
    'AccountTreeControllerInit',
    AllowedInitializationActions,
    never,
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
