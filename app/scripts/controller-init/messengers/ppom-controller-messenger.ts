import { ControllerMessenger } from '@metamask/base-controller';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { PreferencesControllerStateChangeEvent } from '@metamask/preferences-controller';

type MessengerActions = NetworkControllerGetNetworkClientByIdAction;

type MessengerEvents =
  | NetworkControllerStateChangeEvent
  | NetworkControllerNetworkDidChangeEvent
  | PreferencesControllerStateChangeEvent;

export type PPOMControllerInitMessenger = ReturnType<
  typeof getPPOMControllerMessenger
>;

export function getPPOMControllerMessenger(
  controllerMessenger: ControllerMessenger<MessengerActions, MessengerEvents>,
) {
  return controllerMessenger.getRestricted({
    name: 'PPOMController',
    allowedEvents: [
      'NetworkController:stateChange',
      'NetworkController:networkDidChange',
      'PreferencesController:stateChange',
    ],
    allowedActions: ['NetworkController:getNetworkClientById'],
  });
}
