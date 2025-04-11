import { useSelector } from 'react-redux';
import { getNetworkClientIdsToPoll } from '../selectors';
import {
  accountTrackerStartPolling,
  accountTrackerStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useAccountTrackerPolling = () => {
  const networkClientIdsToPoll = useSelector(getNetworkClientIdsToPoll);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const canStartPolling = completedOnboarding && isUnlocked;

  useMultiPolling({
    startPolling: accountTrackerStartPolling,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
    stopPollingByPollingToken: accountTrackerStopPollingByPollingToken,
    input: canStartPolling ? networkClientIdsToPoll : [],
  });
};

export default useAccountTrackerPolling;
