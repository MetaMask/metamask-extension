import {
  ControllerMessenger,
  RestrictedMessenger,
} from '@metamask/base-controller';
import {
  getRateLimitControllerInitMessenger,
  getRateLimitControllerMessenger,
} from './rate-limit-controller-messenger';

describe('getRateLimitControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new ControllerMessenger<never, never>();
    const rateLimitControllerMessenger =
      getRateLimitControllerMessenger(controllerMessenger);

    expect(rateLimitControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getRateLimitControllerInitMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new ControllerMessenger<never, never>();
    const rateLimitControllerInitMessenger =
      getRateLimitControllerInitMessenger(controllerMessenger);

    expect(rateLimitControllerInitMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
