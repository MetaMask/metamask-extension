import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getGasFeeControllerInitMessenger,
  getGasFeeControllerMessenger,
} from './gas-fee-controller-messenger';

describe('getGasFeeControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const gasFeeControllerMessenger = getGasFeeControllerMessenger(messenger);

    expect(gasFeeControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getGasFeeControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const gasFeeControllerInitMessenger =
      getGasFeeControllerInitMessenger(messenger);

    expect(gasFeeControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
