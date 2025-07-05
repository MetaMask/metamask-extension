import { Messenger } from '@metamask/base-controller';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';

type MessengerActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction;

type MessengerEvents = NetworkControllerStateChangeEvent;

export function getSmartTransactionsControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'SmartTransactionsController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
    ],
    allowedEvents: ['NetworkController:stateChange'],
  });
}

export function getSmartTransactionsControllerInitMessenger() {
  return undefined;
}
