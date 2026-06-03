import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { DecryptMessageManagerMessenger } from '@metamask/message-manager';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * decrypt message manager.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The restricted messenger.
 */
export function getDecryptMessageManagerMessenger(
  messenger: RootMessenger<
    MessengerActions<DecryptMessageManagerMessenger>,
    MessengerEvents<DecryptMessageManagerMessenger>
  >,
): DecryptMessageManagerMessenger {
  const decryptMessageManagerMessenger: DecryptMessageManagerMessenger =
    new Messenger({
      namespace: 'DecryptMessageManager',
      parent: messenger,
    });
  return decryptMessageManagerMessenger;
}
