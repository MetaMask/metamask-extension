import { useSelector } from 'react-redux';

import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import {
  getChainIdsToPoll,
  getUseExternalServices,
  getUseTokenDetection,
  getUseTransactionSimulations,
} from '../selectors';
import {
  tokenListStartPolling,
  tokenListStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';

const useTokenListPolling = () => {
  const useTokenDetection = useSelector(getUseTokenDetection);
  const useTransactionSimulations = useSelector(getUseTransactionSimulations);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const useExternalServices = useSelector(getUseExternalServices);
  const chainIds = useSelector(getChainIdsToPoll);

  const enabled =
    completedOnboarding &&
    isUnlocked &&
    useExternalServices &&
    (useTokenDetection || useTransactionSimulations);

  useMultiPolling({
    startPolling: tokenListStartPolling,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
    stopPollingByPollingToken: tokenListStopPollingByPollingToken,
    input: enabled ? chainIds : [],
  });

  return {};
};

export default useTokenListPolling;
