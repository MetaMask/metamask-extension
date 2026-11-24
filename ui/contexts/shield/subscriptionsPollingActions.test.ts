import { SUBSCRIPTIONS_POLLING_INPUT } from '../../../shared/constants/subscriptions';
import { setBackgroundConnection } from '../../store/background-connection';
import {
  subscriptionsStartPolling,
  subscriptionsStopPolling,
} from './subscriptionsPollingActions';

describe('subscriptionsStartPolling', () => {
  it('starts polling through the subscription controller', async () => {
    const messengerCall = jest.fn().mockResolvedValue('subscription-token');
    // @ts-expect-error Only the messenger RPC method is needed for this test.
    setBackgroundConnection({ messengerCall });

    const pollingToken = await subscriptionsStartPolling();

    expect(pollingToken).toBe('subscription-token');
    expect(messengerCall).toHaveBeenCalledWith(
      'SubscriptionController:startPolling',
      [SUBSCRIPTIONS_POLLING_INPUT],
    );
  });
});

describe('subscriptionsStopPolling', () => {
  it('stops polling through the subscription controller', async () => {
    const messengerCall = jest.fn().mockResolvedValue(undefined);
    // @ts-expect-error Only the messenger RPC method is needed for this test.
    setBackgroundConnection({ messengerCall });

    await subscriptionsStopPolling('subscription-token');

    expect(messengerCall).toHaveBeenCalledWith(
      'SubscriptionController:stopPollingByPollingToken',
      ['subscription-token'],
    );
  });
});
