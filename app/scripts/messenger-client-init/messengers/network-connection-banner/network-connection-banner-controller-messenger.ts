import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { NetworkConnectionBannerControllerMessenger } from '@metamask/network-connection-banner-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a messenger for the NetworkConnectionBannerController.
 *
 * @param messenger - The root messenger.
 * @returns The messenger for NetworkConnectionBannerController.
 */
export function getNetworkConnectionBannerControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NetworkConnectionBannerControllerMessenger>,
    MessengerEvents<NetworkConnectionBannerControllerMessenger>
  >,
): NetworkConnectionBannerControllerMessenger {
  const controllerMessenger: NetworkConnectionBannerControllerMessenger =
    new Messenger({
      namespace: 'NetworkConnectionBannerController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getState',
      'NetworkController:getNetworkConfigurationByChainId',
      'NetworkController:updateNetwork',
      'NetworkController:setActiveNetwork',
      'NetworkEnablementController:getState',
      'ConnectivityController:getState',
    ],
    events: [
      'NetworkController:stateChange',
      'NetworkEnablementController:stateChange',
      'ConnectivityController:stateChange',
      'ClientController:stateChanged',
      'KeyringController:unlock',
      'KeyringController:lock',
    ],
  });
  return controllerMessenger;
}
