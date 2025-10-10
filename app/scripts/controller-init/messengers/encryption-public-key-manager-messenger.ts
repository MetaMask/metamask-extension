import { Messenger } from '@metamask/base-controller';

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
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'EncryptionPublicKeyManager',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
