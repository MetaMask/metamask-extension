import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { type ClientControllerMessenger } from '@metamask/client-controller';
import { RootMessenger } from '../../../lib/messenger';

export type { ClientControllerMessenger } from '@metamask/client-controller';

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
  return new Messenger<
    'ClientController',
    MessengerActions<ClientControllerMessenger>,
    MessengerEvents<ClientControllerMessenger>,
    typeof messenger
  >({
    namespace: 'ClientController',
    parent: messenger,
  });
}
