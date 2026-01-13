import { Messenger } from '@metamask/messenger';
import {
  controllerName,
  ConnectivityControllerActions,
  ConnectivityControllerEvents,
  ConnectivityControllerMessenger,
} from '../../../controllers/connectivity/types';
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
    typeof controllerName,
    ConnectivityControllerActions,
    ConnectivityControllerEvents,
    typeof messenger
  >({
    namespace: controllerName,
    parent: messenger,
  });
}
