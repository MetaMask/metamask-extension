import { useSelector } from 'react-redux';
import { getUseCurrencyRateCheck } from '../selectors';
import {
  currencyRateStartPollingByNetworkClientId,
  currencyRateStopPollingByPollingToken,
} from '../store/actions';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import usePolling from './usePolling';

const useCurrencyRatePolling = (networkClientId: string) => {
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const completedOnboarding = useSelector(getCompletedOnboarding);

  usePolling({
    startPollingByNetworkClientId: currencyRateStartPollingByNetworkClientId,
    stopPollingByPollingToken: currencyRateStopPollingByPollingToken,
    networkClientId,
    enabled: useCurrencyRateCheck && completedOnboarding,
  });
};

export default useCurrencyRatePolling;
