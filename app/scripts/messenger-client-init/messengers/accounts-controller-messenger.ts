import { AccountsControllerMessenger } from '@metamask/accounts-controller';
import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * accounts controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAccountsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AccountsControllerMessenger>,
    MessengerEvents<AccountsControllerMessenger>
  >,
): AccountsControllerMessenger {
  const accountsControllerMessenger: AccountsControllerMessenger =
    new Messenger({
      namespace: 'AccountsController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: accountsControllerMessenger,
    actions: [
      'KeyringController:getState',
      'KeyringController:getKeyringsByType',
    ],
    events: [
      'KeyringController:stateChange',
      'SnapKeyring:accountAssetListUpdated',
      'SnapKeyring:accountBalancesUpdated',
      'SnapKeyring:accountTransactionsUpdated',
      'MultichainNetworkController:networkDidChange',
    ],
  });
  return accountsControllerMessenger;
}
