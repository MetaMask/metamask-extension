import { Messenger } from '@metamask/base-controller';
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
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'NetworkEnablementController',
    allowedActions: [
      'NetworkController:getState',
      'MultichainNetworkController:getState',
    ],
    allowedEvents: [
      'NetworkController:networkAdded',
      'NetworkController:networkRemoved',
      'NetworkController:stateChange',
      'TransactionController:transactionSubmitted',
    ],
  });
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
  messenger: Messenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  return messenger.getRestricted({
    name: 'NetworkEnablementControllerInit',
    allowedActions: [
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
    ],
    allowedEvents: [
      'AccountsController:selectedAccountChange',
      'AccountTreeController:selectedAccountGroupChange',
    ],
  });
}
