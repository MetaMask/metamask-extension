import { useSelector } from 'react-redux';
import {
  getAllDetectedTokensForSelectedAddress,
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

  // Selectors returning state updated by the polling
  const detectedTokens = useSelector(getAllDetectedTokensForSelectedAddress);

  useMultiPolling({
    startPolling: tokenDetectionStartPolling,
    stopPollingByPollingToken: tokenDetectionStopPollingByPollingToken,
    input: useTokenDetection ? [chainIds] : [],
  });

  return {
    detectedTokens,
  };
};

export default useTokenDetectionPolling;
