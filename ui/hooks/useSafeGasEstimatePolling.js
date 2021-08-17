import { useEffect } from 'react';
import {
  disconnectGasFeeEstimatePoller,
  getGasFeeEstimatesAndStartPolling,
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../store/actions';

/**
 * Provides a reusable hook that can be used for safely updating the polling
 * data in the gas fee controller. It makes a request to get estimates and
 * begin polling, keeping track of the poll token for the lifetime of the hook.
 * It then disconnects polling upon unmount. If the hook is unmounted while waiting
 * for `getGasFeeEstimatesAndStartPolling` to resolve, the `active` flag ensures
 * that a call to disconnect happens after promise resolution.
 */
export function useSafeGasEstimatePolling() {
  useEffect(() => {
    let active = true;
    let pollToken;

    const cleanup = () => {
      active = false;
      if (pollToken) {
        disconnectGasFeeEstimatePoller(pollToken);
        removePollingTokenFromAppState(pollToken);
      }
    };

    getGasFeeEstimatesAndStartPolling().then((newPollToken) => {
      if (active) {
        pollToken = newPollToken;
        addPollingTokenToAppState(pollToken);
      } else {
        disconnectGasFeeEstimatePoller(newPollToken);
        removePollingTokenFromAppState(pollToken);
      }
    });

    window.addEventListener('beforeunload', cleanup);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };
  }, []);
}
