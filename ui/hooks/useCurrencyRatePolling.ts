import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  getChainIdsToPoll,
  getUseCurrencyRateCheck,
  useSafeChainsListValidationSelector,
} from '../selectors';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { getOriginalNativeTokenSymbol } from '../helpers/utils/isOriginalNativeTokenSymbol';
import {
  currencyRateStartPolling,
  currencyRateStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import usePolling from './usePolling';

const useNativeCurrencies = () => {
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );
  const [nativeCurrencies, setNativeCurrencies] = useState<string[]>([]);
  const chainIds = useSelector(getChainIdsToPoll);

  useEffect(() => {
    // Use validated currency tickers
    const fetchNativeCurrencies = async () => {
      const nativeCurrenciesArray = await Promise.all(
        Object.values(networkConfigurations).map(async (n) => {
          const originalToken = await getOriginalNativeTokenSymbol({
            chainId: n.chainId,
            useAPICall: useSafeChainsListValidation && completedOnboarding,
          });

          if (!chainIds.includes(n.chainId)) {
            return null;
          }

          return originalToken ?? n.nativeCurrency;
        }),
      );

      // Use a type predicate to filter out null values.
      const filteredCurrencies = nativeCurrenciesArray.filter(
        (currency): currency is NonNullable<typeof currency> =>
          currency !== null,
      );
      const uniqueCurrencies = [...new Set(filteredCurrencies)];
      setNativeCurrencies(uniqueCurrencies);
    };
    fetchNativeCurrencies();
  }, [
    chainIds,
    completedOnboarding,
    networkConfigurations,
    useSafeChainsListValidation,
  ]);

  return nativeCurrencies;
};

const useCurrencyRatePolling = () => {
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);

  const nativeCurrencies = useNativeCurrencies();

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
