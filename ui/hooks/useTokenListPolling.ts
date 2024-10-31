import { useSelector } from 'react-redux';
import {
  getNetworkConfigurationsByChainId,
  getPreferences,
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

  const chainIds = Object.keys(networkConfigurations) as Hex[];

  if (useTokenDetection || petnamesEnabled || useTransactionSimulations) {
    useMultiPolling({
      startPolling: tokenListStartPolling,
      stopPollingByPollingToken: tokenListStopPollingByPollingToken,
      input: chainIds,
    });
  }

  return {
    // TODO: Eventually return token list here. UI elements will
    // consume them from this hook instead of a selector directly.
  };
};
export default useTokenListPolling;
