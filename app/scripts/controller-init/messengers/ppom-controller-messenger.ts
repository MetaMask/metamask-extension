import { Messenger } from '@metamask/base-controller';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { PPOMControllerMessenger } from '@metamask/ppom-validator';
import { PreferencesControllerStateChangeEvent } from '@metamask/preferences-controller';

type MessengerActions = NetworkControllerGetNetworkClientByIdAction;

type MessengerEvents =
  | NetworkControllerStateChangeEvent
  | NetworkControllerNetworkDidChangeEvent
  | PreferencesControllerStateChangeEvent;

export type PPOMControllerInitMessenger = ReturnType<
  typeof getPPOMControllerInitMessenger
>;

export function getPPOMControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): PPOMControllerMessenger {
  return messenger.getRestricted({
    name: 'PPOMController',
    allowedEvents: [
      'NetworkController:stateChange',
      'NetworkController:networkDidChange',
    ],
    allowedActions: ['NetworkController:getNetworkClientById'],
  });
}

type AllowedInitializationActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction;

export function getPPOMControllerInitMessenger(
  messenger: Messenger<
    MessengerActions | AllowedInitializationActions,
    MessengerEvents
  >,
) {
  return messenger.getRestricted({
    name: 'PPOMControllerInit',
    allowedEvents: ['PreferencesController:stateChange'],
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
    ],
  });
}
