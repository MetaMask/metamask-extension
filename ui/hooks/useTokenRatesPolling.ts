import { useSelector } from 'react-redux';
import {
  getNetworkConfigurationsByChainId,
  getUseCurrencyRateCheck,
} from '../selectors';
import {
  tokenRatesStartPolling,
  tokenRatesStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';

const useTokenRatesPolling = () => {
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const networkClientIds = Object.values(networkConfigurations).map(
    (n) => n.rpcEndpoints[n.defaultRpcEndpointIndex].networkClientId,
  );
  useMultiPolling({
    startPolling: tokenRatesStartPolling,
    stopPollingByPollingToken: tokenRatesStopPollingByPollingToken,
    input: useCurrencyRateCheck ? networkClientIds : [],
  });

  return {
    // TODO: Eventually return token rates here. UI elements will
    // consume them from this hook instead of a selector directly.
  };
};

export default useTokenRatesPolling;
