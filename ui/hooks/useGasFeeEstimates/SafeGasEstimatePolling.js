import {
  disconnectGasFeeEstimatePoller,
  getGasFeeEstimatesAndStartPolling,
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../../store/actions';

/**
 * Provides a singleton object that can be used for safely updating the polling
 * data in the gas fee controller. It makes a request to get estimates and
 * begin polling, keeping track of the poll token.
 * It then disconnects polling upon window unload.
 */
export const SafeGasEstimatePolling = {
  active: false,
  pollToken: undefined,

  startPolling: function startPolling() {
    if (this.active === false) {
      this.active = true;
      getGasFeeEstimatesAndStartPolling().then((newPollToken) => {
        this.pollToken = newPollToken;
        addPollingTokenToAppState(this.pollToken);
      });

      window.addEventListener('beforeunload', this.cleanup);
    }
  },
  cleanup: function cleanup() {
    this.active = false;
    if (this.pollToken) {
      disconnectGasFeeEstimatePoller(this.pollToken);
      removePollingTokenFromAppState(this.pollToken);
    }
    window.removeEventListener('beforeunload', this.cleanup);
  },
};
