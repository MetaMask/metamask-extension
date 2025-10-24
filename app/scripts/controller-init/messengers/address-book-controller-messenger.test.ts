import { Messenger } from '@metamask/messenger';
import { getAddressBookControllerMessenger } from './address-book-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';

describe('getAddressBookControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const addressBookControllerMessenger =
      getAddressBookControllerMessenger(messenger);

    expect(addressBookControllerMessenger).toBeInstanceOf(Messenger);
  });
});
