import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getChainIdsToPoll, getUseCurrencyRateCheck } from '../selectors';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { isOriginalNativeTokenSymbol } from '../helpers/utils/isOriginalNativeTokenSymbol';
import {
  currencyRateStartPolling,
  currencyRateStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import usePolling from './usePolling';

const useCurrencyRatePolling = () => {
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const chainIds = useSelector(getChainIdsToPoll);

  // State to store the native currencies computed asynchronously.
  const [nativeCurrencies, setNativeCurrencies] = useState<string[]>([]);

  useEffect(() => {
    const fetchNativeCurrencies = async () => {
      const nativeCurrenciesArray = await Promise.all(
        Object.values(networkConfigurations).map(async (n) => {
          const isOriginal = await isOriginalNativeTokenSymbol({
            ticker: n.nativeCurrency,
            chainId: n.chainId,
          }).catch(() => false);
          return isOriginal && chainIds.includes(n.chainId)
            ? n.nativeCurrency
            : null;
        }),
      );

      // Use a type predicate to filter out null values.
      const filteredCurrencies = nativeCurrenciesArray.filter(
        (currency): currency is string => currency !== null,
      );
      const uniqueCurrencies = [...new Set(filteredCurrencies)];
      setNativeCurrencies(uniqueCurrencies);
    };

    fetchNativeCurrencies();
  }, [networkConfigurations, chainIds]);

  const enabled =
    completedOnboarding &&
    isUnlocked &&
    useCurrencyRateCheck &&
    nativeCurrencies.length > 0;

  // usePolling is a custom hook that is invoked synchronously.
  usePolling({
    startPolling: currencyRateStartPolling,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    stopPollingByPollingToken: currencyRateStopPollingByPollingToken,
    input: nativeCurrencies,
    enabled,
  });
};

export default useCurrencyRatePolling;
