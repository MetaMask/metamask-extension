import {
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';

/**
 * Informs the DeFiPositionsController that the UI requires defi positions polling
 *
 * @returns polling token that can be used to stop polling.
 */
export async function deFiStartPolling(): Promise<string> {
  const pollingToken = await submitRequestToBackground(
    'DeFiPositionsController:startPolling',
    [null],
  );

  await addPollingTokenToAppState(pollingToken);
  return pollingToken;
}

/**
 * Informs the DeFiPositionsController that the UI no longer needs defi positions polling
 *
 * @param pollingToken - Poll token received from calling deFiStartPolling
 */
export async function deFiStopPolling(pollingToken: string) {
  await submitRequestToBackground(
    'DeFiPositionsController:stopPollingByPollingToken',
    [pollingToken],
  );
  await removePollingTokenFromAppState(pollingToken);
}
