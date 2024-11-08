import { useSelector } from 'react-redux';
import { getNetworkConfigurationsByChainId, getTokenList } from '../selectors';
import {
  tokenListStartPolling,
  tokenListStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';

const useTokenListPolling = () => {
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const tokenList = useSelector(getTokenList);

  useMultiPolling({
    startPolling: tokenListStartPolling,
    stopPollingByPollingToken: tokenListStopPollingByPollingToken,
    input: Object.keys(networkConfigurations),
  });

  return {
    tokenList,
  };
};

export default useTokenListPolling;
