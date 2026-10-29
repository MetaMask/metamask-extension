import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getCurrencyRateControllerInitMessenger,
  getCurrencyRateControllerMessenger,
} from './currency-rate-controller-messenger';

describe('getCurrencyRateControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const currencyRateControllerMessenger =
      getCurrencyRateControllerMessenger(messenger);

    expect(currencyRateControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getCurrencyRateControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const currencyRateControllerInitMessenger =
      getCurrencyRateControllerInitMessenger(messenger);

    expect(currencyRateControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
