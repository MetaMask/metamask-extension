import { useSelector } from 'react-redux';
import {
  getMarketData,
  getNetworkConfigurationsByChainId,
  getTokenExchangeRates,
  getTokensMarketData,
  getUseCurrencyRateCheck,
} from '../selectors';
import {
  tokenRatesStartPolling,
  tokenRatesStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';

const useTokenRatesPolling = ({ chainIds }: { chainIds?: string[] } = {}) => {
  // Selectors to determine polling input
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  // Selectors returning state updated by the polling
  const tokenExchangeRates = useSelector(getTokenExchangeRates);
  const tokensMarketData = useSelector(getTokensMarketData);
  const marketData = useSelector(getMarketData);

  useMultiPolling({
    startPolling: tokenRatesStartPolling,
    stopPollingByPollingToken: tokenRatesStopPollingByPollingToken,
    input: useCurrencyRateCheck
      ? chainIds ?? Object.keys(networkConfigurations)
      : [],
  });

  return {
    tokenExchangeRates,
    tokensMarketData,
    marketData,
  };
};

export default useTokenRatesPolling;
