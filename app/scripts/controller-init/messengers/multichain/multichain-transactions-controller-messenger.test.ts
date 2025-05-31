import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMultichainTransactionsControllerMessenger } from './multichain-transactions-controller-messenger';

describe('getMultichainTransactionsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const multichainTransactionsControllerMessenger =
      getMultichainTransactionsControllerMessenger(messenger);

    expect(multichainTransactionsControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
