import { useSelector } from 'react-redux';
import {
  getNetworkConfigurationsByChainId,
  getUseCurrencyRateCheck,
} from '../selectors';
import {
  currencyRateStartPolling,
  currencyRateStopPollingByPollingToken,
} from '../store/actions';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useCurrencyRatePolling = () => {
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const nativeCurrencies =
    useCurrencyRateCheck && completedOnboarding
      ? [
          ...new Set(
            Object.values(networkConfigurations).map((n) => n.nativeCurrency),
          ),
        ]
      : [];

  useMultiPolling({
    startPolling: currencyRateStartPolling,
    stopPollingByPollingToken: currencyRateStopPollingByPollingToken,
    input: [nativeCurrencies],
  });

  return {
    // TODO: Eventually return currency rates here. UI elements will
    // consume them from this hook instead of a selector directly.
  };
};
export default useCurrencyRatePolling;
