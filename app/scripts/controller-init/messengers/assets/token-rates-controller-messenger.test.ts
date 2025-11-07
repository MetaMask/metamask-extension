import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getTokenRatesControllerInitMessenger,
  getTokenRatesControllerMessenger,
} from './token-rates-controller-messenger';

describe('getTokenRatesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const tokenRatesControllerMessenger =
      getTokenRatesControllerMessenger(messenger);

    expect(tokenRatesControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getTokenRatesControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const tokenRatesControllerInitMessenger =
      getTokenRatesControllerInitMessenger(messenger);

    expect(tokenRatesControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
