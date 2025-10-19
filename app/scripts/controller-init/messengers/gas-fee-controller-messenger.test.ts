import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getGasFeeControllerInitMessenger,
  getGasFeeControllerMessenger,
} from './gas-fee-controller-messenger';

describe('getGasFeeControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const gasFeeControllerMessenger = getGasFeeControllerMessenger(messenger);

    expect(gasFeeControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getGasFeeControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const gasFeeControllerInitMessenger =
      getGasFeeControllerInitMessenger(messenger);

    expect(gasFeeControllerInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
