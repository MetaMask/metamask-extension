import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

export type PasskeyControllerMessenger = ReturnType<
  typeof getPasskeyControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * passkey controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPasskeyControllerMessenger(
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<'PasskeyController', never, never, typeof messenger>({
    namespace: 'PasskeyController',
    parent: messenger,
  });
}
