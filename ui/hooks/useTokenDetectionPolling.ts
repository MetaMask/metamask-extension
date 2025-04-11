import { useSelector } from 'react-redux';

import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import { getChainIdsToPoll, getUseTokenDetection } from '../selectors';
import {
  tokenDetectionStartPolling,
  tokenDetectionStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';

const useTokenDetectionPolling = () => {
  const useTokenDetection = useSelector(getUseTokenDetection);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const chainIds = useSelector(getChainIdsToPoll);

  const enabled = completedOnboarding && isUnlocked && useTokenDetection;

  useMultiPolling({
    startPolling: tokenDetectionStartPolling,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
    stopPollingByPollingToken: tokenDetectionStopPollingByPollingToken,
    input: enabled ? [chainIds] : [],
  });

  return {};
};

export default useTokenDetectionPolling;
