import { useSelector } from 'react-redux';
import {
  FALL_BACK_VS_CURRENCY,
  TESTNET_TICKER_SYMBOLS,
} from '@metamask/controller-utils';
import {
  getNetworkConfigurationsByChainId,
  getSelectedNetworkClientId,
  getUseCurrencyRateCheck,
} from '../selectors';
import {
  currencyRateStartPolling,
  currencyRateStopPollingByPollingToken,
  tokenRatesStartPolling,
  tokenRatesStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getNativeCurrency,
} from '../ducks/metamask/metamask';
import usePolling from './usePolling';
import useMultiPolling from './useMultiPolling';

const useTokenRatesPolling = () => {
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const networkClientIds = Object.values(networkConfigurations).map(n =>
    n.rpcEndpoints[n.defaultRpcEndpointIndex].networkClientId
  )

  useMultiPolling({
    startPolling: tokenRatesStartPolling,
    stopPollingByPollingToken: tokenRatesStopPollingByPollingToken,
    input: networkClientIds,
  });
};

export default useTokenRatesPolling;

