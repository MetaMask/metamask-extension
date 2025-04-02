import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getDeFiPositionsControllerMessenger } from './defi-positions-controller-messenger';

describe('getTokenRatesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const tokenRatesControllerMessenger =
      getDeFiPositionsControllerMessenger(messenger);

    expect(tokenRatesControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
