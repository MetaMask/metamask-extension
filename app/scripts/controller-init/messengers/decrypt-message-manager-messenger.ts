import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<'DecryptMessageManager', never, never, typeof messenger>(
    {
      namespace: 'DecryptMessageManager',
      parent: messenger,
    },
  );
}
