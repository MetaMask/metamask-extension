import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMultichainAccountServiceMessenger } from './multichain-account-service-messenger';

describe('getMultichainAccountServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const accountWalletControllerMessenger =
      getMultichainAccountServiceMessenger(messenger);

    expect(accountWalletControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
