import {
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../actions';
import { submitRequestToBackground } from '../background-connection';

/**
 * Informs the MultichainAssetsRatesController that the UI requires asset rate polling
 *
 * @param accountId - account Id to poll.
 * @returns polling token that can be used to stop polling
 */
export async function multichainAssetsRatesStartPolling(
  accountId: string,
): Promise<string> {
  const pollingToken = await submitRequestToBackground<string>(
    'multichainAssetsRatesStartPolling',
    [{ accountId }],
  );
  await addPollingTokenToAppState(pollingToken);
  return pollingToken;
}

/**
 * Informs the MultichainAssetsRatesController that the UI no longer requires asset rate polling
 *
 * @param pollingToken - Poll token received from calling MultichainAssetsRatesController
 */
export async function multichainAssetsRatesStopPollingByPollingToken(
  pollingToken: string,
) {
  await submitRequestToBackground(
    'multichainAssetsRatesStopPollingByPollingToken',
    [pollingToken],
  );
  await removePollingTokenFromAppState(pollingToken);
}
