import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { SecretEscrowControllerMessenger } from '@metamask/secret-escrow-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * secret escrow controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSecretEscrowControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SecretEscrowControllerMessenger>,
    MessengerEvents<SecretEscrowControllerMessenger>
  >,
): SecretEscrowControllerMessenger {
  const controllerMessenger: SecretEscrowControllerMessenger = new Messenger({
    namespace: 'SecretEscrowController',
    parent: messenger,
  });
  return controllerMessenger;
}
