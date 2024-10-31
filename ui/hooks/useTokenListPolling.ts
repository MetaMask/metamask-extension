import { useSelector } from 'react-redux';
import {
  getNetworkConfigurationsByChainId,
  getPreferences,
  selectERC20TokensByChain,
} from '../selectors';
import {
  tokenListStartPolling,
  tokenListStopPollingByPollingToken,
} from '../store/actions';
import useMultiPolling from './useMultiPolling';
import { Hex } from '@metamask/utils';

const useTokenListPolling = () => {
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const { petnamesEnabled, useTokenDetection, useTransactionSimulations } =
    useSelector(getPreferences);
  const tokensChainsCache = useSelector(selectERC20TokensByChain);

  const chainIds = Object.keys(networkConfigurations) as Hex[];

  if (useTokenDetection || petnamesEnabled || useTransactionSimulations) {
    useMultiPolling({
      startPolling: tokenListStartPolling,
      stopPollingByPollingToken: tokenListStopPollingByPollingToken,
      input: chainIds,
    });
  }

  return {
    tokensChainsCache,
  };
};
export default useTokenListPolling;
