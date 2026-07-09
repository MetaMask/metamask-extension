import { SUBSCRIPTIONS_POLLING_INPUT } from '../../../shared/constants/subscriptions';
import {
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';

/**
 * Informs the SubscriptionController that the UI requires subscription polling.
 *
 * @returns Polling token that can be used to stop polling.
 */
export async function subscriptionsStartPolling(): Promise<string> {
  const pollingToken = await submitRequestToBackground<string>(
    'subscriptionsStartPolling',
    [SUBSCRIPTIONS_POLLING_INPUT],
  );

  await addPollingTokenToAppState(pollingToken);
  return pollingToken;
}

/**
 * Informs the SubscriptionController that the UI no longer requires subscription polling.
 *
 * @param pollingToken - Poll token received from calling subscriptionsStartPolling.
 */
export async function subscriptionsStopPolling(pollingToken: string) {
  await submitRequestToBackground('subscriptionsStopPolling', [pollingToken]);
  await removePollingTokenFromAppState(pollingToken);
}
