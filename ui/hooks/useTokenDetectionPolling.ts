import { useSelector } from 'react-redux';
import {
  getNetworkConfigurationsByChainId,
  getUseTokenDetection,
} from '../selectors';
import {
  tokenDetectionStartPolling,
  tokenDetectionStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';

const useTokenDetectionPolling = () => {
  const useTokenDetection = useSelector(getUseTokenDetection);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const chainIds = Object.keys(networkConfigurations);

  useMultiPolling({
    startPolling: tokenDetectionStartPolling,
    stopPollingByPollingToken: tokenDetectionStopPollingByPollingToken,
    input: useTokenDetection ? [chainIds] : [],
  });

  return {};
};

export default useTokenDetectionPolling;
