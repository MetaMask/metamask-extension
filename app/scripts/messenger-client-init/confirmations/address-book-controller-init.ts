import { AddressBookController } from '@metamask/address-book-controller';
import { MessengerClientInitFunction } from '../types';
import { AddressBookControllerMessenger } from '../messengers';

/**
 * Initialize the address book controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const AddressBookControllerInit: MessengerClientInitFunction<
  AddressBookController,
  AddressBookControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new AddressBookController({
    messenger: controllerMessenger,
    state: persistedState.AddressBookController,
  });

  return {
    messengerClient,
  };
};
