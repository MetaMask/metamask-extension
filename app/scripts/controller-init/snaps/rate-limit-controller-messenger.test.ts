import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getRateLimitControllerInitMessenger,
  getRateLimitControllerMessenger,
} from './rate-limit-controller-messenger';

describe('getRateLimitControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const messenger = new Messenger<never, never>();
    const rateLimitControllerMessenger =
      getRateLimitControllerMessenger(messenger);

    expect(rateLimitControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getRateLimitControllerInitMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const messenger = new Messenger<never, never>();
    const rateLimitControllerInitMessenger =
      getRateLimitControllerInitMessenger(messenger);

    expect(rateLimitControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
