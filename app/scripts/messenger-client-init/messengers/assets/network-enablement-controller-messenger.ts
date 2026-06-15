import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { NetworkEnablementControllerMessenger } from '@metamask/network-enablement-controller';
import { AccountsControllerSelectedAccountChangeEvent } from '@metamask/accounts-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import { RootMessenger } from '../../../lib/messenger';

export function getNetworkEnablementControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NetworkEnablementControllerMessenger>,
    MessengerEvents<NetworkEnablementControllerMessenger>
  >,
): NetworkEnablementControllerMessenger {
  const controllerMessenger: NetworkEnablementControllerMessenger =
    new Messenger({
      namespace: 'NetworkEnablementController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getState',
      'MultichainNetworkController:getState',
    ],
    events: [
      'NetworkController:networkAdded',
      'NetworkController:networkRemoved',
      'NetworkController:stateChange',
      'TransactionController:transactionSubmitted',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction;

type AllowedInitializationEvents =
  | AccountsControllerSelectedAccountChangeEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent;

export type NetworkEnablementControllerInitMessenger = ReturnType<
  typeof getNetworkEnablementControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed initialization events of the
 * network enablement controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getNetworkEnablementControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'NetworkEnablementControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'NetworkEnablementControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['AccountTreeController:getAccountsFromSelectedAccountGroup'],
    events: [
      'AccountsController:selectedAccountChange',
      'AccountTreeController:selectedAccountGroupChange',
    ],
  });
  return controllerInitMessenger;
}
