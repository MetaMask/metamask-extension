import { Messenger } from '@metamask/messenger';

import { getRootMessenger } from '../../../lib/messenger';
import {
  getSubscriptionControllerMessenger,
  getSubscriptionControllerInitMessenger,
} from './subscription-controller-messenger';

describe('getSubscriptionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const subscriptionControllerMessenger =
      getSubscriptionControllerMessenger(messenger);

    expect(subscriptionControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getSubscriptionControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const subscriptionControllerInitMessenger =
      getSubscriptionControllerInitMessenger(messenger);

    expect(subscriptionControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
