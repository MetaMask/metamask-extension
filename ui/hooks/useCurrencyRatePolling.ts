import { useSelector } from 'react-redux';
import { getUseCurrencyRateCheck } from '../selectors';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    stopPollingByPollingToken: currencyRateStopPollingByPollingToken,
    input: nativeCurrencies,
    enabled,
  });
};

export default useCurrencyRatePolling;
