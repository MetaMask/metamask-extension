import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getSwapsControllerInitMessenger,
  getSwapsControllerMessenger,
} from './swaps-controller-messenger';

describe('getSwapsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const SwapsControllerMessenger = getSwapsControllerMessenger(messenger);

    expect(SwapsControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getSwapsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const SwapsControllerInitMessenger =
      getSwapsControllerInitMessenger(messenger);

    expect(SwapsControllerInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
