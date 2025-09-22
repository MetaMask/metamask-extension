import {
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../actions';
import { submitRequestToBackground } from '../background-connection';

/**
 * Informs the CurrencyRateController that the UI requires currency rate polling
 *
 * @param nativeCurrencies - An array of native currency symbols
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
 * Informs the CurrencyRateController that the UI no longer requires currency rate polling
 * for the given network client.
 * If all network clients unsubscribe, the controller stops polling.
 *
 * @param pollingToken - Poll token received from calling currencyRateStartPolling
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
