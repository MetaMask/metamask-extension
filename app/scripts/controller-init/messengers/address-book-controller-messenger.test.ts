import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getAddressBookControllerMessenger } from './address-book-controller-messenger';

describe('getAddressBookControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const addressBookControllerMessenger =
      getAddressBookControllerMessenger(messenger);

    expect(addressBookControllerMessenger).toBeInstanceOf(Messenger);
  });
});
