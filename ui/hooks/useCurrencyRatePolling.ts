import { useSelector } from 'react-redux';
import {
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

const useCurrencyRatePolling = (networkClientId?: string) => {
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);
  const nativeCurrency = useSelector(getNativeCurrency);

  usePolling({
    startPolling: currencyRateStartPolling,
    stopPollingByPollingToken: currencyRateStopPollingByPollingToken,
    input: nativeCurrency,
    enabled: useCurrencyRateCheck && completedOnboarding,
  });
};

export default useCurrencyRatePolling;
