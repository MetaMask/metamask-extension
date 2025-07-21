import { useSelector } from 'react-redux';
import {
  getChainIdsToPoll,
  getEnabledChainIds,
  getUseTokenDetection,
} from '../selectors';
import {
  tokenDetectionStartPolling,
  tokenDetectionStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import { isGlobalNetworkSelectorRemoved } from '../selectors/selectors';
import useMultiPolling from './useMultiPolling';

const useTokenDetectionPolling = () => {
  const useTokenDetection = useSelector(getUseTokenDetection);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const chainIds = useSelector(getChainIdsToPoll);
  const enabledChainIds = useSelector(getEnabledChainIds);

  const enabled = completedOnboarding && isUnlocked && useTokenDetection;

  const pollableChains = isGlobalNetworkSelectorRemoved
    ? enabledChainIds
    : chainIds;

  useMultiPolling({
    startPolling: tokenDetectionStartPolling,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    stopPollingByPollingToken: tokenDetectionStopPollingByPollingToken,
    input: enabled ? [pollableChains] : [],
  });

  return {};
};

export default useTokenDetectionPolling;
