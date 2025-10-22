import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAddressBookControllerMessenger } from './address-book-controller-messenger';

describe('getAddressBookControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const addressBookControllerMessenger =
      getAddressBookControllerMessenger(messenger);

    expect(addressBookControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
