import { Messenger } from '@metamask/messenger';

import { getRootMessenger } from '..';
import { getSubscriptionServiceMessenger } from './subscription-service-messenger';

describe('getSubscriptionServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const subscriptionServiceMessenger =
      getSubscriptionServiceMessenger(messenger);

    expect(subscriptionServiceMessenger).toBeInstanceOf(Messenger);
  });
});
