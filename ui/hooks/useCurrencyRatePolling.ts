import { useSelector } from 'react-redux';
import {
  getNetworkConfigurationsByChainId,
  getUseCurrencyRateCheck,
} from '../selectors';
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

  const enabled = completedOnboarding && isUnlocked && useCurrencyRateCheck;

  const nativeCurrencies = [
    ...new Set(
      Object.values(networkConfigurations).map((n) => n.nativeCurrency),
    ),
  ];

  usePolling({
    startPolling: currencyRateStartPolling,
    stopPollingByPollingToken: currencyRateStopPollingByPollingToken,
    input: nativeCurrencies,
    enabled,
  });
};

export default useCurrencyRatePolling;
