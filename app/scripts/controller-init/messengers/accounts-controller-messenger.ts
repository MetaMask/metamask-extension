import { Messenger } from '@metamask/base-controller';
import { AllowedActions, AllowedEvents } from '@metamask/accounts-controller';

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
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'AccountsController',
    allowedActions: [
      'KeyringController:getState',
      'KeyringController:getKeyringsByType',
    ],
    allowedEvents: [
      'SnapController:stateChange',
      'KeyringController:stateChange',
      'SnapKeyring:accountAssetListUpdated',
      'SnapKeyring:accountBalancesUpdated',
      'SnapKeyring:accountTransactionsUpdated',
      'MultichainNetworkController:networkDidChange',
    ],
  });
}
