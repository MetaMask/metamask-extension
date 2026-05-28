import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { PasskeyControllerMessenger } from '@metamask/passkey-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * passkey controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPasskeyControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<PasskeyControllerMessenger>,
    MessengerEvents<PasskeyControllerMessenger>
  >,
): PasskeyControllerMessenger {
  const controllerMessenger: PasskeyControllerMessenger = new Messenger({
    namespace: 'PasskeyController',
    parent: messenger,
  });
  return controllerMessenger;
}
