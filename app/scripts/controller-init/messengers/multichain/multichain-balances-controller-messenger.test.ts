import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMultichainBalancesControllerMessenger } from './multichain-balances-controller-messenger';

describe('getMultichainBalancesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const multichainBalancesControllerMessenger =
      getMultichainBalancesControllerMessenger(messenger);

    expect(multichainBalancesControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
