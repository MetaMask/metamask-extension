import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getMultichainBalancesControllerMessenger,
  getMultichainBalancesControllerInitMessenger,
} from './multichain-balances-controller-messenger';

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

describe('getMultichainBalancesControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const multichainBalancesControllerInitMessenger =
      getMultichainBalancesControllerInitMessenger(messenger);

    expect(multichainBalancesControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
