import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMultichainAccountControllerMessenger } from './multichain-account-controller-messenger';

describe('getMultichainAccountControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const accountWalletControllerMessenger =
      getMultichainAccountControllerMessenger(messenger);

    expect(accountWalletControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
