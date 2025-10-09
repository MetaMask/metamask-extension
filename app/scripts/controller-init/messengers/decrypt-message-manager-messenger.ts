import { Messenger } from '@metamask/base-controller';

export type DecryptMessageManagerMessenger = ReturnType<
  typeof getDecryptMessageManagerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * decrypt message manager.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getDecryptMessageManagerMessenger(
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'DecryptMessageManager',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
