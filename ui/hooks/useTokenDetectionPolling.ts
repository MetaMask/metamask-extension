import { useSelector } from 'react-redux';
import {
  getNetworkConfigurationsByChainId,
  getUseTokenDetection,
} from '../selectors';
import {
  tokenDetectionStartPolling,
  tokenDetectionStopPollingByPollingToken,
} from '../store/actions';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useTokenDetectionPolling = () => {
  const useTokenDetection = useSelector(getUseTokenDetection);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const enabled = completedOnboarding && useTokenDetection;

  useMultiPolling({
    startPolling: tokenDetectionStartPolling,
    stopPollingByPollingToken: tokenDetectionStopPollingByPollingToken,
    input: enabled ? [Object.keys(networkConfigurations)] : [],
  });

  return {};
};

export default useTokenDetectionPolling;
