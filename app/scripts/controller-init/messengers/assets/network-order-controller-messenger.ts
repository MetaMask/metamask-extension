import { Messenger } from '@metamask/base-controller';
import {
  NetworkControllerGetStateAction,
  NetworkControllerNetworkRemovedEvent,
  NetworkControllerNetworkAddedEvent,
  NetworkControllerSetActiveNetworkAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';

type Actions =
  | NetworkControllerGetStateAction
  | NetworkControllerSetActiveNetworkAction;
type Events =
  | NetworkControllerStateChangeEvent
  | NetworkControllerNetworkRemovedEvent
  | NetworkControllerNetworkAddedEvent;

export type NetworkOrderControllerMessenger = ReturnType<
  typeof getNetworkOrderControllerMessenger
>;

export function getNetworkOrderControllerMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'NetworkOrderController',
    allowedEvents: [
      'NetworkController:stateChange',
      'NetworkController:networkRemoved',
      'NetworkController:networkAdded',
    ],
    allowedActions: [
      'NetworkController:getState',
      'NetworkController:setActiveNetwork',
    ],
  });
}
