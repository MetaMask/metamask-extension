import { useSelector } from 'react-redux';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import {
  getSelectedInternalAccount,
  getUseCurrencyRateCheck,
} from '../selectors';
import usePolling from './usePolling';
import {
  multichainAssetsRatesStartPolling,
  multichainAssetsRatesStopPollingByPollingToken,
} from '../store/controller-actions/multichain-asset-rates-controller';

const usePollingEnabled = () => {
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  return completedOnboarding && isUnlocked && useCurrencyRateCheck;
};

const useSelectedAccountId = () => {
  const account = useSelector(getSelectedInternalAccount);
  return account.id;
};

const useMultichainAssetsRatesPolling = () => {
  const pollingEnabled = usePollingEnabled();
  const accountId = useSelectedAccountId();

  usePolling({
    startPolling: multichainAssetsRatesStartPolling,
    stopPollingByPollingToken: multichainAssetsRatesStopPollingByPollingToken,
    input: accountId,
    enabled: pollingEnabled,
  });
};

export default useMultichainAssetsRatesPolling;
