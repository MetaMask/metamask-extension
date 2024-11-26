import { useSelector } from 'react-redux';
import { getChainIdsToPoll, getUseTokenDetection } from '../selectors';
import {
  tokenDetectionStartPolling,
  tokenDetectionStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useTokenDetectionPolling = () => {
  const useTokenDetection = useSelector(getUseTokenDetection);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const chainIds = useSelector(getChainIdsToPoll);

  const enabled = completedOnboarding && isUnlocked && useTokenDetection;

  useMultiPolling({
    startPolling: tokenDetectionStartPolling,
    stopPollingByPollingToken: tokenDetectionStopPollingByPollingToken,
    input: enabled ? [chainIds] : [],
  });

  return {};
};

export default useTokenDetectionPolling;
