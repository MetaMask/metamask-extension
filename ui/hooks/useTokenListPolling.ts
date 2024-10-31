import { useSelector } from 'react-redux';
import { getNetworkConfigurationsByChainId } from '../selectors';
import {
  tokenListStartPolling,
  tokenListStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';

const useTokenListPolling = () => {
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const chainIds = Object.keys(networkConfigurations);

  useMultiPolling({
    startPolling: tokenListStartPolling,
    stopPollingByPollingToken: tokenListStopPollingByPollingToken,
    input: [chainIds],
  });

  return {
    // TODO: Eventually return token list here. UI elements will
    // consume them from this hook instead of a selector directly.
  };
};
export default useTokenListPolling;
