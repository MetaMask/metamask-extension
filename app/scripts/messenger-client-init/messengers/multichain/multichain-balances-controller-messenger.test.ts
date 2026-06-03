import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getMultichainBalancesControllerMessenger } from './multichain-balances-controller-messenger';

describe('getMultichainBalancesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const multichainBalancesControllerMessenger =
      getMultichainBalancesControllerMessenger(messenger);

    expect(multichainBalancesControllerMessenger).toBeInstanceOf(Messenger);
  });
});
