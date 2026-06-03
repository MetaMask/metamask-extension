import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { type ClientControllerMessenger } from '@metamask/client-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a messenger for the ClientController.
 *
 * @param messenger - The root messenger.
 * @returns The messenger for ClientController.
 */
export function getClientControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<ClientControllerMessenger>,
    MessengerEvents<ClientControllerMessenger>
  >,
): ClientControllerMessenger {
  const controllerMessenger: ClientControllerMessenger = new Messenger({
    namespace: 'ClientController',
    parent: messenger,
  });
  return controllerMessenger;
}
