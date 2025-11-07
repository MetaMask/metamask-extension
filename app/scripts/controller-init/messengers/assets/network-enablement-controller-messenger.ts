import { Messenger } from '@metamask/messenger';
import { MultichainNetworkControllerGetStateAction } from '@metamask/multichain-network-controller';
import {
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
  NetworkControllerNetworkRemovedEvent,
  NetworkControllerNetworkAddedEvent,
} from '@metamask/network-controller';
import { TransactionControllerTransactionSubmittedEvent } from '@metamask/transaction-controller';
import { AccountsControllerSelectedAccountChangeEvent } from '@metamask/accounts-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | NetworkControllerGetStateAction
  | MultichainNetworkControllerGetStateAction;

type Events =
  | NetworkControllerNetworkAddedEvent
  | NetworkControllerNetworkRemovedEvent
  | NetworkControllerStateChangeEvent
  | TransactionControllerTransactionSubmittedEvent;

export type NetworkEnablementControllerMessenger = ReturnType<
  typeof getNetworkEnablementControllerMessenger
>;

export function getNetworkEnablementControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'NetworkEnablementController',
    Actions,
    Events,
    typeof messenger
  >({
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
