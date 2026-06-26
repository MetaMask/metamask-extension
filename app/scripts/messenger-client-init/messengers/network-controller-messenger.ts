import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { NetworkControllerMessenger } from '@metamask/network-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Get a messenger restricted to actions the NetworkController needs.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getNetworkControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NetworkControllerMessenger>,
    MessengerEvents<NetworkControllerMessenger>
  >,
): NetworkControllerMessenger {
  const controllerMessenger: NetworkControllerMessenger = new Messenger({
    namespace: 'NetworkController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AnalyticsController:getState',
      'AnalyticsController:trackEvent',
      'ConnectivityController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: ['RemoteFeatureFlagController:stateChange'],
  });
  return controllerMessenger;
}
