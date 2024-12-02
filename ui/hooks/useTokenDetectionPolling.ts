import { useSelector } from 'react-redux';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
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
import useMultiPolling from './useMultiPolling';

const useTokenDetectionPolling = () => {
  const useTokenDetection = useSelector(getUseTokenDetection);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const currentChainId = useSelector(getCurrentChainId);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const enabled = completedOnboarding && isUnlocked && useTokenDetection;

  const chainIds = process.env.PORTFOLIO_VIEW
    ? Object.keys(networkConfigurations)
    : [currentChainId];

  useMultiPolling({
    startPolling: tokenDetectionStartPolling,
    stopPollingByPollingToken: tokenDetectionStopPollingByPollingToken,
    input: enabled ? [chainIds] : [],
  });

  return {};
};

export default useTokenDetectionPolling;
