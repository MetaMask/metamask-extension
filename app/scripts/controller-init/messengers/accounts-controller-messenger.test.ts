import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getAccountsControllerMessenger } from './accounts-controller-messenger';

describe('getAccountsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const accountsControllerMessenger =
      getAccountsControllerMessenger(messenger);

    expect(accountsControllerMessenger).toBeInstanceOf(Messenger);
  });
});
