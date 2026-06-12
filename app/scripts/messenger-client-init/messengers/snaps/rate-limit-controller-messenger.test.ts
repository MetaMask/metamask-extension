import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getRateLimitControllerInitMessenger,
  getRateLimitControllerMessenger,
} from './rate-limit-controller-messenger';

describe('getRateLimitControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const rateLimitControllerMessenger =
      getRateLimitControllerMessenger(messenger);

    expect(rateLimitControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getRateLimitControllerInitMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const rateLimitControllerInitMessenger =
      getRateLimitControllerInitMessenger(messenger);

    expect(rateLimitControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
