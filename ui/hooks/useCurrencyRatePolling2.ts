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
} from '../store/actions';
import {
  getCompletedOnboarding,
  getNativeCurrency,
} from '../ducks/metamask/metamask';
import usePolling from './usePolling';
import useMultiPolling from './useMultiPolling';

const useCurrencyRatePolling2 = () => {
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const testnetSymbols = Object.values(TESTNET_TICKER_SYMBOLS);
  const nativeCurrencies = [
    ...new Set(
      Object.values(networkConfigurations).map((n) =>
        // For testnet currencies like 'SepoliaETH', fetch rates for real ETH.
        testnetSymbols.includes(n.nativeCurrency)
          ? FALL_BACK_VS_CURRENCY
          : n.nativeCurrency,
      ),
    ),
  ];

  useMultiPolling({
    startPolling: currencyRateStartPolling,
    stopPollingByPollingToken: currencyRateStopPollingByPollingToken,
    input: nativeCurrencies,
  });
};

export default useCurrencyRatePolling2;
