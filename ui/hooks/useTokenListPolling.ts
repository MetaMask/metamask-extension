import { useSelector } from 'react-redux';
import {
  getNetworkConfigurationsByChainId,
  getPetnamesEnabled,
  getUseTokenDetection,
  getUseTransactionSimulations,
} from '../selectors';
import {
  tokenListStartPolling,
  tokenListStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';

const useTokenListPolling = () => {
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const useTokenDetection = useSelector(getUseTokenDetection);
  const useTransactionSimulations = useSelector(getUseTransactionSimulations);
  const petnamesEnabled = useSelector(getPetnamesEnabled);

  const enabled =
    useTokenDetection || petnamesEnabled || useTransactionSimulations;

  useMultiPolling({
    startPolling: tokenListStartPolling,
    stopPollingByPollingToken: tokenListStopPollingByPollingToken,
    input: enabled ? Object.keys(networkConfigurations) : [],
  });

  return {};
};

export default useTokenListPolling;
