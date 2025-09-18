import { Messenger, RestrictedMessenger } from '@metamask/base-controller';

import {
  getSubscriptionControllerMessenger,
  getSubscriptionControllerInitMessenger,
} from './subscription-controller-messenger';

describe('getSubscriptionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const subscriptionControllerMessenger =
      getSubscriptionControllerMessenger(messenger);

    expect(subscriptionControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});

describe('getSubscriptionControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const subscriptionControllerInitMessenger =
      getSubscriptionControllerInitMessenger(messenger);

    expect(subscriptionControllerInitMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
