import { Messenger, RestrictedMessenger } from '@metamask/base-controller';

import { getSubscriptionServiceMessenger } from './subscription-service-messenger';

describe('getSubscriptionServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const subscriptionServiceMessenger =
      getSubscriptionServiceMessenger(messenger);

    expect(subscriptionServiceMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
