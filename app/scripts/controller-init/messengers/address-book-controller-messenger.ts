import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

export type AddressBookControllerMessenger = ReturnType<
  typeof getAddressBookControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * address book controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAddressBookControllerMessenger(
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<'AddressBookController', never, never, typeof messenger>(
    {
      namespace: 'AddressBookController',
      parent: messenger,
    },
  );
}
