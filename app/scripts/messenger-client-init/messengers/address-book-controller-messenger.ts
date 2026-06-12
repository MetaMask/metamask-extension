import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { AddressBookControllerMessenger } from '@metamask/address-book-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * address book controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAddressBookControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AddressBookControllerMessenger>,
    MessengerEvents<AddressBookControllerMessenger>
  >,
): AddressBookControllerMessenger {
  const controllerMessenger: AddressBookControllerMessenger = new Messenger({
    namespace: 'AddressBookController',
    parent: messenger,
  });
  return controllerMessenger;
}
