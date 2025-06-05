import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getAccountTreeControllerMessenger } from './account-tree-controller-messenger';

describe('getAccountWalletControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const accountWalletControllerMessenger =
      getAccountTreeControllerMessenger(messenger);

    expect(accountWalletControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
