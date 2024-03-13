import { useSelector } from 'react-redux';
import { getUseCurrencyRateCheck } from '../selectors';
import {
  currencyRateStartPollingByNetworkClientId,
  currencyRateStopPollingByPollingToken,
} from '../store/actions';
import usePolling from './usePolling';

const useCurrencyRatePolling = (networkClientId: string) => {
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  usePolling({
    startPollingByNetworkClientId: currencyRateStartPollingByNetworkClientId,
    stopPollingByPollingToken: currencyRateStopPollingByPollingToken,
    networkClientId,
    enabled: useCurrencyRateCheck,
  });
};

export default useCurrencyRatePolling;
