import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';
import { NetworkOrderControllerMessenger } from '../../../controllers/network-order';

export function getNetworkOrderControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NetworkOrderControllerMessenger>,
    MessengerEvents<NetworkOrderControllerMessenger>
  >,
) {
  const controllerMessenger: NetworkOrderControllerMessenger = new Messenger({
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
