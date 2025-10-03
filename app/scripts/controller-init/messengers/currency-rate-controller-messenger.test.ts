import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getCurrencyRateControllerInitMessenger,
  getCurrencyRateControllerMessenger,
} from './currency-rate-controller-messenger';

describe('getCurrencyRateControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const currencyRateControllerMessenger =
      getCurrencyRateControllerMessenger(messenger);

    expect(currencyRateControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getCurrencyRateControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const currencyRateControllerInitMessenger =
      getCurrencyRateControllerInitMessenger(messenger);

    expect(currencyRateControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
