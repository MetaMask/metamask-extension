import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  type MockAnyNamespace,
} from '@metamask/messenger';

import { RewardsControllerGetActualSubscriptionIdAction } from '../../../controllers/rewards/rewards-controller-method-action-types';
import { getRootMessenger } from '../../../lib/messenger';
import { getShieldSubscriptionServiceMessenger } from './shield-subscription-service-messenger';

describe('getShieldSubscriptionServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const subscriptionServiceMessenger =
      getShieldSubscriptionServiceMessenger(messenger);

    expect(subscriptionServiceMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates RewardsController:getActualSubscriptionId', () => {
    const baseMessenger = new Messenger<
      MockAnyNamespace,
      RewardsControllerGetActualSubscriptionIdAction,
      never
    >({ namespace: MOCK_ANY_NAMESPACE });
    const rewardAccountId =
      'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
    const getActualSubscriptionId = jest
      .fn()
      .mockReturnValue('rewards_subscription_id');

    baseMessenger.registerActionHandler(
      'RewardsController:getActualSubscriptionId',
      getActualSubscriptionId,
    );

    const subscriptionServiceMessenger =
      getShieldSubscriptionServiceMessenger(baseMessenger);

    expect(
      subscriptionServiceMessenger.call(
        'RewardsController:getActualSubscriptionId',
        rewardAccountId,
      ),
    ).toBe('rewards_subscription_id');
    expect(getActualSubscriptionId).toHaveBeenCalledWith(rewardAccountId);
  });
});
