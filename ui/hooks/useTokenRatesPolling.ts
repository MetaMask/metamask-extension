import { useSelector } from 'react-redux';
import {
  getChainIdsToPoll,
  getMarketData,
  getTokenExchangeRates,
  getTokensMarketData,
  getUseCurrencyRateCheck,
} from '../selectors';
import { getEnabledChainIds } from '../selectors/multichain/networks';
import {
  tokenRatesStartPolling,
  tokenRatesStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import { isGlobalNetworkSelectorRemoved } from '../selectors/selectors';
import useMultiPolling from './useMultiPolling';

const useTokenRatesPolling = () => {
  // Selectors to determine polling input
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const chainIds = useSelector(getChainIdsToPoll);
  const enabledChainIds = useSelector(getEnabledChainIds);

  // Selectors returning state updated by the polling
  const tokenExchangeRates = useSelector(getTokenExchangeRates);
  const tokensMarketData = useSelector(getTokensMarketData);
  const marketData = useSelector(getMarketData);

  const enabled = completedOnboarding && isUnlocked && useCurrencyRateCheck;

  const pollableChains = isGlobalNetworkSelectorRemoved
    ? enabledChainIds
    : chainIds;

  useMultiPolling({
    startPolling: tokenRatesStartPolling,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    stopPollingByPollingToken: tokenRatesStopPollingByPollingToken,
    input: enabled ? [pollableChains] : [],
  });

  return {
    tokenExchangeRates,
    tokensMarketData,
    marketData,
  };
};

export default useTokenRatesPolling;
