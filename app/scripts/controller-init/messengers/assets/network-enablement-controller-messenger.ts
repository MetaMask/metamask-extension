import { Messenger } from '@metamask/base-controller';
import { MultichainNetworkControllerGetStateAction } from '@metamask/multichain-network-controller';
import {
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
  NetworkControllerNetworkRemovedEvent,
  NetworkControllerNetworkAddedEvent,
} from '@metamask/network-controller';
import { TransactionControllerTransactionSubmittedEvent } from '@metamask/transaction-controller';

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
