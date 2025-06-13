import { useSelector } from 'react-redux';
import {
  getEnabledNetworkClientIds,
  getNetworkClientIdsToPoll,
} from '../selectors';
import {
  accountTrackerStartPolling,
  accountTrackerStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import { isGlobalNetworkSelectorRemoved } from '../selectors/selectors';
import useMultiPolling from './useMultiPolling';

const useAccountTrackerPolling = () => {
  const networkClientIdsToPoll = useSelector(getNetworkClientIdsToPoll);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const enabledNetworkClientIds = useSelector(getEnabledNetworkClientIds);
  const canStartPolling = completedOnboarding && isUnlocked;

  const pollableNetworkClientIds = isGlobalNetworkSelectorRemoved
    ? enabledNetworkClientIds
    : networkClientIdsToPoll;

  useMultiPolling({
    startPolling: accountTrackerStartPolling,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    stopPollingByPollingToken: accountTrackerStopPollingByPollingToken,
    input: canStartPolling ? pollableNetworkClientIds : [],
  });
};

export default useAccountTrackerPolling;
