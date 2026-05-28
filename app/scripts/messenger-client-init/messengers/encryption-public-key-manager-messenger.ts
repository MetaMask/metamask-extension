import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { EncryptionPublicKeyManagerMessenger } from '@metamask/message-manager';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * encryption public key manager.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The restricted messenger.
 */
export function getEncryptionPublicKeyManagerMessenger(
  messenger: RootMessenger<
    MessengerActions<EncryptionPublicKeyManagerMessenger>,
    MessengerEvents<EncryptionPublicKeyManagerMessenger>
  >,
): EncryptionPublicKeyManagerMessenger {
  const encryptionPublicKeyManagerMessenger: EncryptionPublicKeyManagerMessenger =
    new Messenger({
      namespace: 'EncryptionPublicKeyManager',
      parent: messenger,
    });
  return encryptionPublicKeyManagerMessenger;
}
