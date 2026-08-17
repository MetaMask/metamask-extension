import { Messenger } from '@metamask/messenger';

import { getRootMessenger } from '../../../lib/messenger';
import { getShieldSubscriptionServiceMessenger } from './shield-subscription-service-messenger';

describe('getShieldSubscriptionServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const subscriptionServiceMessenger =
      getShieldSubscriptionServiceMessenger(messenger);

    expect(subscriptionServiceMessenger).toBeInstanceOf(Messenger);
  });
});
