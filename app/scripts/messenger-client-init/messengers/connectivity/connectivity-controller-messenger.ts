import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { ConnectivityControllerMessenger } from '@metamask/connectivity-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a messenger for the ConnectivityController.
 *
 * @param messenger - The root messenger.
 * @returns The messenger for ConnectivityController.
 */
export function getConnectivityControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<ConnectivityControllerMessenger>,
    MessengerEvents<ConnectivityControllerMessenger>
  >,
): ConnectivityControllerMessenger {
  const controllerMessenger: ConnectivityControllerMessenger = new Messenger({
    namespace: 'ConnectivityController',
    parent: messenger,
  });
  return controllerMessenger;
}
