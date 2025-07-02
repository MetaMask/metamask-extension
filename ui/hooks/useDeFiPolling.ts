import { useSelector } from 'react-redux';
import {
  getChainIdsToPoll,
  getUseTokenDetection,
  isGlobalNetworkSelectorRemoved,
} from '../selectors';
import { getEnabledChainIds } from '../selectors/multichain/networks';
import {
  deFiStartPolling,
  deFiStopPolling,
  tokenDetectionStartPolling,
  tokenDetectionStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useDeFiPolling = () => {
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const enabled = completedOnboarding;

  useMultiPolling({
    startPolling: deFiStartPolling,
    stopPollingByPollingToken: deFiStopPolling,
    input: enabled ? [null] : [],
  });

  return {};
};

export default useDeFiPolling;
