import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getMultichainTransactionsControllerMessenger } from './multichain-transactions-controller-messenger';

describe('getMultichainTransactionsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const multichainTransactionsControllerMessenger =
      getMultichainTransactionsControllerMessenger(messenger);

    expect(multichainTransactionsControllerMessenger).toBeInstanceOf(Messenger);
  });
});
