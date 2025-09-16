import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getTokenBalancesControllerInitMessenger,
  getTokenBalancesControllerMessenger,
} from './token-balances-controller-messenger';

describe('getTokenBalancesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const controllerMessenger = getTokenBalancesControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getTokenBalancesControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const initMessenger = getTokenBalancesControllerInitMessenger(messenger);

    expect(initMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
