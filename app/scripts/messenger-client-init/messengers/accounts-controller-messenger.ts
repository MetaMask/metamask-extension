import { AllowedActions, AllowedEvents } from '@metamask/accounts-controller';
import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

export type AccountsControllerMessenger = ReturnType<
  typeof getAccountsControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * accounts controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAccountsControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const accountsControllerMessenger = new Messenger<
    'AccountsController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
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
      'SnapController:stateChange',
      'KeyringController:stateChange',
      'SnapKeyring:accountAssetListUpdated',
      'SnapKeyring:accountBalancesUpdated',
      'SnapKeyring:accountTransactionsUpdated',
      'MultichainNetworkController:networkDidChange',
    ],
  });
  return accountsControllerMessenger;
}
