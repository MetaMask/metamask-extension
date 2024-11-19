import { useSelector } from 'react-redux';
import {
  getMarketData,
  getTokenExchangeRates,
  getTokensMarketData,
  getUseCurrencyRateCheck,
} from '../selectors';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import {
  tokenRatesStartPolling,
  tokenRatesStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useTokenRatesPolling = ({ chainIds }: { chainIds?: string[] } = {}) => {
  // Selectors to determine polling input
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  // Selectors returning state updated by the polling
  const tokenExchangeRates = useSelector(getTokenExchangeRates);
  const tokensMarketData = useSelector(getTokensMarketData);
  const marketData = useSelector(getMarketData);

  const enabled = completedOnboarding && isUnlocked && useCurrencyRateCheck;

  useMultiPolling({
    startPolling: tokenRatesStartPolling,
    stopPollingByPollingToken: tokenRatesStopPollingByPollingToken,
    input: enabled ? chainIds ?? Object.keys(networkConfigurations) : [],
  });

  return {
    tokenExchangeRates,
    tokensMarketData,
    marketData,
  };
};

export default useTokenRatesPolling;
