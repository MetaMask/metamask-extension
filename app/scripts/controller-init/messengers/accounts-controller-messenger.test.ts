import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAccountsControllerMessenger } from './accounts-controller-messenger';

describe('getAccountsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const accountsControllerMessenger =
      getAccountsControllerMessenger(messenger);

    expect(accountsControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
