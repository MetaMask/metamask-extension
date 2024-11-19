import { useSelector } from 'react-redux';
import {
  getNetworkConfigurationsByChainId,
  getPetnamesEnabled,
  getUseExternalServices,
  getUseTokenDetection,
  getUseTransactionSimulations,
} from '../selectors';
import {
  tokenListStartPolling,
  tokenListStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import useMultiPolling from './useMultiPolling';

const useTokenListPolling = () => {
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const useTokenDetection = useSelector(getUseTokenDetection);
  const useTransactionSimulations = useSelector(getUseTransactionSimulations);
  const petnamesEnabled = useSelector(getPetnamesEnabled);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const useExternalServices = useSelector(getUseExternalServices);

  const enabled =
    completedOnboarding &&
    isUnlocked &&
    useExternalServices &&
    (useTokenDetection || petnamesEnabled || useTransactionSimulations);

  useMultiPolling({
    startPolling: tokenListStartPolling,
    stopPollingByPollingToken: tokenListStopPollingByPollingToken,
    input: enabled ? Object.keys(networkConfigurations) : [],
  });

  return {};
};

export default useTokenListPolling;
