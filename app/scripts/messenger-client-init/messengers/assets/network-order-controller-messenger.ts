import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetStateAction,
  NetworkControllerNetworkRemovedEvent,
  NetworkControllerSetActiveNetworkAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | NetworkControllerGetStateAction
  | NetworkControllerSetActiveNetworkAction;
type Events =
  | NetworkControllerStateChangeEvent
  | NetworkControllerNetworkRemovedEvent;

export type NetworkOrderControllerMessenger = ReturnType<
  typeof getNetworkOrderControllerMessenger
>;

export function getNetworkOrderControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'NetworkOrderController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'NetworkOrderController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'NetworkController:stateChange',
      'NetworkController:networkRemoved',
    ],
    actions: [
      'NetworkController:getState',
      'NetworkController:setActiveNetwork',
    ],
  });
  return controllerMessenger;
}
