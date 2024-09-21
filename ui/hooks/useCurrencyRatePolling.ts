import { useSelector } from 'react-redux';
import {
  getSelectedNetworkClientId,
  getUseCurrencyRateCheck,
} from '../selectors';
import {
  currencyRateStartPollingByNetworkClientId,
  currencyRateStopPollingByPollingToken,
} from '../store/actions';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import usePolling from './usePolling';

const useCurrencyRatePolling = (networkClientId?: string) => {
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

  usePolling({
    startPollingByNetworkClientId: currencyRateStartPollingByNetworkClientId,
    stopPollingByPollingToken: currencyRateStopPollingByPollingToken,
    networkClientId: networkClientId ?? selectedNetworkClientId,
    enabled: useCurrencyRateCheck && completedOnboarding,
  });
};

export default useCurrencyRatePolling;
