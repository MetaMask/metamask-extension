import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { PPOMControllerMessenger } from '@metamask/ppom-validator';
import { PreferencesControllerStateChangeEvent } from '@metamask/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

type MessengerActions = NetworkControllerGetNetworkClientByIdAction;

type MessengerEvents =
  | NetworkControllerStateChangeEvent
  | NetworkControllerNetworkDidChangeEvent
  | PreferencesControllerStateChangeEvent;

export type PPOMControllerInitMessenger = ReturnType<
  typeof getPPOMControllerInitMessenger
>;

export function getPPOMControllerMessenger(
  messenger: RootMessenger<MessengerActions, MessengerEvents>,
): PPOMControllerMessenger {
  const controllerMessenger = new Messenger<
    'PPOMController',
    MessengerActions,
    MessengerEvents,
    typeof messenger
  >({
    namespace: 'PPOMController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'NetworkController:stateChange',
      'NetworkController:networkDidChange',
    ],
    actions: ['NetworkController:getNetworkClientById'],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction;

export function getPPOMControllerInitMessenger(
  messenger: RootMessenger<
    MessengerActions | AllowedInitializationActions,
    MessengerEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'PPOMControllerInit',
    MessengerActions | AllowedInitializationActions,
    MessengerEvents,
    typeof messenger
  >({
    namespace: 'PPOMControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    events: ['PreferencesController:stateChange'],
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
    ],
  });
  return controllerInitMessenger;
}
