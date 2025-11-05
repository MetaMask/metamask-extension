import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getSwapsControllerInitMessenger,
  getSwapsControllerMessenger,
} from './swaps-controller-messenger';

describe('getSwapsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const SwapsControllerMessenger = getSwapsControllerMessenger(messenger);

    expect(SwapsControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getSwapsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const SwapsControllerInitMessenger =
      getSwapsControllerInitMessenger(messenger);

    expect(SwapsControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
