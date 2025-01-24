import { ControllerMessenger } from '@metamask/base-controller';
import {
  NetworkControllerGetNetworkClientByIdAction,
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
  controllerMessenger: ControllerMessenger<MessengerActions, MessengerEvents>,
): PPOMControllerMessenger {
  return controllerMessenger.getRestricted({
    name: 'PPOMController',
    allowedEvents: [
      'NetworkController:stateChange',
      'NetworkController:networkDidChange',
    ],
    allowedActions: ['NetworkController:getNetworkClientById'],
  });
}

export function getPPOMControllerInitMessenger(
  controllerMessenger: ControllerMessenger<MessengerActions, MessengerEvents>,
) {
  return controllerMessenger.getRestricted({
    name: 'PPOMControllerInit',
    allowedEvents: ['PreferencesController:stateChange'],
    allowedActions: [],
  });
}
