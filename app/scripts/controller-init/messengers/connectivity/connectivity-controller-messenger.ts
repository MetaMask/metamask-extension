import { Messenger } from '@metamask/messenger';
import type {
  ConnectivityControllerActions,
  ConnectivityControllerEvents,
  ConnectivityControllerMessenger,
} from '@metamask/connectivity-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a messenger for the ConnectivityController.
 *
 * @param messenger - The root messenger.
 * @returns The messenger for ConnectivityController.
 */
export function getConnectivityControllerMessenger(
  messenger: RootMessenger<
    ConnectivityControllerActions,
    ConnectivityControllerEvents
  >,
): ConnectivityControllerMessenger {
  return new Messenger<
    'ConnectivityController',
    ConnectivityControllerActions,
    ConnectivityControllerEvents,
    typeof messenger
  >({
    namespace: 'ConnectivityController',
    parent: messenger,
  });
}
