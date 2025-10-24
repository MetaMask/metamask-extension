import { Messenger } from '@metamask/base-controller';

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
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'AddressBookController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
