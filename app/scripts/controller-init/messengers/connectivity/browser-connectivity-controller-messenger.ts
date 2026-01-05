import { Messenger } from '@metamask/messenger';
import {
  CONTROLLER_NAME,
  BrowserConnectivityControllerActions,
  BrowserConnectivityControllerEvents,
  BrowserConnectivityControllerMessenger,
} from '../../../controllers/connectivity/types';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a messenger for the BrowserConnectivityController.
 *
 * @param messenger - The root messenger.
 * @returns The messenger for BrowserConnectivityController.
 */
export function getBrowserConnectivityControllerMessenger(
  messenger: RootMessenger<
    BrowserConnectivityControllerActions,
    BrowserConnectivityControllerEvents
  >,
): BrowserConnectivityControllerMessenger {
  return new Messenger<
    typeof CONTROLLER_NAME,
    BrowserConnectivityControllerActions,
    BrowserConnectivityControllerEvents,
    typeof messenger
  >({
    namespace: CONTROLLER_NAME,
    parent: messenger,
  });
}
