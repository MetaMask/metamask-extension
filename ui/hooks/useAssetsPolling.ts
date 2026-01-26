import { useSelector } from 'react-redux';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';
import {
  assetsStartPolling,
  assetsStopPollingByPollingToken,
} from '../store/actions';

/**
 * Hook to start/stop AssetsController polling based on UI state.
 * Polls for asset data including prices and balances.
 */
const useAssetsPolling = () => {
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);

  const enabled = completedOnboarding && isUnlocked;

  useMultiPolling({
    startPolling: assetsStartPolling,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    stopPollingByPollingToken: assetsStopPollingByPollingToken,
    // No input needed - the controller gets accounts/chains internally
    input: enabled ? [[]] : [],
  });
};

export default useAssetsPolling;
