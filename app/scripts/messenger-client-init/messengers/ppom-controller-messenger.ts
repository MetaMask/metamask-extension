import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import { PPOMControllerMessenger } from '@metamask/ppom-validator';
import { RootMessenger } from '../../lib/messenger';
import type { PreferencesControllerStateChangeEvent } from '../../controllers/preferences-controller';

export function getPPOMControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<PPOMControllerMessenger>,
    MessengerEvents<PPOMControllerMessenger>
  >,
): PPOMControllerMessenger {
  const controllerMessenger: PPOMControllerMessenger = new Messenger({
    namespace: 'PPOMController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: ['NetworkController:networkDidChange'],
    actions: ['NetworkController:getNetworkClientById'],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction;

type AllowedInitializationEvents = PreferencesControllerStateChangeEvent;

export type PPOMControllerInitMessenger = ReturnType<
  typeof getPPOMControllerInitMessenger
>;

export function getPPOMControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'PPOMControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
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
