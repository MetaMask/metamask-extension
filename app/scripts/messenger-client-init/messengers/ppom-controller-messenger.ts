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

type AllowedActions = NetworkControllerGetNetworkClientByIdAction;

type AllowedEvents =
  | NetworkControllerStateChangeEvent
  | NetworkControllerNetworkDidChangeEvent
  | PreferencesControllerStateChangeEvent;

export function getPPOMControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): PPOMControllerMessenger {
  const controllerMessenger = new Messenger<
    'PPOMController',
    AllowedActions,
    AllowedEvents,
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

export type PPOMControllerInitMessenger = ReturnType<
  typeof getPPOMControllerInitMessenger
>;

export function getPPOMControllerInitMessenger(
  messenger: RootMessenger<
    AllowedActions | AllowedInitializationActions,
    AllowedEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'PPOMControllerInit',
    AllowedActions | AllowedInitializationActions,
    AllowedEvents,
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
