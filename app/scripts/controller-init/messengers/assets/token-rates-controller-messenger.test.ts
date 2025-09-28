import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getTokenRatesControllerInitMessenger,
  getTokenRatesControllerMessenger,
} from './token-rates-controller-messenger';

describe('getTokenRatesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const tokenRatesControllerMessenger =
      getTokenRatesControllerMessenger(messenger);

    expect(tokenRatesControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getTokenRatesControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const tokenRatesControllerInitMessenger =
      getTokenRatesControllerInitMessenger(messenger);

    expect(tokenRatesControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
