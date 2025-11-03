import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

export type EncryptionPublicKeyManagerMessenger = ReturnType<
  typeof getEncryptionPublicKeyManagerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * encryption public key manager.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getEncryptionPublicKeyManagerMessenger(
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<
    'EncryptionPublicKeyManager',
    never,
    never,
    typeof messenger
  >({
    namespace: 'EncryptionPublicKeyManager',
    parent: messenger,
  });
}
