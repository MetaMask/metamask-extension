import { Messenger } from '@metamask/messenger';
import { getAccountsControllerMessenger } from './accounts-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';

describe('getAccountsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const accountsControllerMessenger =
      getAccountsControllerMessenger(messenger);

    expect(accountsControllerMessenger).toBeInstanceOf(Messenger);
  });
});
