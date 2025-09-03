import { useSelector } from 'react-redux';
import {
  getChainIdsToPoll,
  getUseExternalServices,
  getUseTokenDetection,
  getUseTransactionSimulations,
} from '../selectors';
import { getEnabledChainIds } from '../selectors/multichain/networks';
import {
  tokenListStartPolling,
  tokenListStopPollingByPollingToken,
} from '../store/actions';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import { isGlobalNetworkSelectorRemoved } from '../selectors/selectors';
import useMultiPolling from './useMultiPolling';

const useTokenListPolling = () => {
  const useTokenDetection = useSelector(getUseTokenDetection);
  const useTransactionSimulations = useSelector(getUseTransactionSimulations);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const useExternalServices = useSelector(getUseExternalServices);
  const chainIds = useSelector(getChainIdsToPoll);
  const enabledChainIds = useSelector(getEnabledChainIds);

  const enabled =
    completedOnboarding &&
    isUnlocked &&
    useExternalServices &&
    (useTokenDetection || useTransactionSimulations);

  const pollableChains = isGlobalNetworkSelectorRemoved
    ? enabledChainIds
    : chainIds;

  useMultiPolling({
    startPolling: tokenListStartPolling,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    stopPollingByPollingToken: tokenListStopPollingByPollingToken,
    input: enabled ? pollableChains : [],
  });

  return {};
};

export default useTokenListPolling;
