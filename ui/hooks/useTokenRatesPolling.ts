import { useSelector } from 'react-redux';
import {
  getChainIdsToPoll,
  getMarketData,
  getTokenExchangeRates,
  getTokensMarketData,
  getUseCurrencyRateCheck,
} from '../selectors';
import {
  tokenRatesStartPolling,
  tokenRatesStopPollingByPollingToken,
} from '../store/actions';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useTokenRatesPolling = () => {
  // Selectors to determine polling input
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const chainIds = useSelector(getChainIdsToPoll);
  const networkConfiguration = useSelector(getNetworkConfigurationsByChainId);

  const input = chainIds.map((chainId) => ({
    chainId,
    // TODO: use the selected currency instead of the native currency
    nativeCurrency:
      networkConfiguration[chainId as `0x${string}`].nativeCurrency,
  }));

  // Selectors returning state updated by the polling
  const tokenExchangeRates = useSelector(getTokenExchangeRates);
  const tokensMarketData = useSelector(getTokensMarketData);
  const marketData = useSelector(getMarketData);

  const enabled = completedOnboarding && isUnlocked && useCurrencyRateCheck;

  useMultiPolling({
    startPolling: tokenRatesStartPolling,
    stopPollingByPollingToken: tokenRatesStopPollingByPollingToken,
    input: enabled ? [input] : [],
  });

  // price -> 1 / 1usdt , balance -> balanceController

  return {
    tokenExchangeRates,
    tokensMarketData,
    marketData,
  };
};

export default useTokenRatesPolling;
