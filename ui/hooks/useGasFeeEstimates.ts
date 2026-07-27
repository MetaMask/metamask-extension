import isEqual from 'lodash/isEqual';
import { useSelector } from 'react-redux';
import {
  getGasEstimateTypeByChainId,
  getGasFeeEstimatesByChainId,
  getIsGasEstimatesLoadingByChainId,
  getIsNetworkBusyByChainId,
} from '../ducks/metamask/metamask';
import {
  gasFeeStartPollingByNetworkClientId,
  gasFeeStopPollingByPollingToken,
} from '../store/actions';
import {
  getSelectedNetworkClientId,
  getChainIdByNetworkClientId,
} from '../../shared/lib/selectors/networks';
import usePolling from './usePolling';

type GasEstimates = {
  /** The estimate object */
  gasFeeEstimates: unknown;
  /** The type of estimate provided */
  gasEstimateType: unknown;
  /** Indicates whether the gas estimates are currently loading */
  isGasEstimatesLoading: boolean;
  /** Indicates whether the network is busy */
  isNetworkBusy: boolean;
};

/**
 * Gets the current gasFeeEstimates from state and begins polling for new
 * estimates. When this hook is removed from the tree it will signal to the
 * GasFeeController that it is done requiring new gas estimates. Also checks
 * the returned gas estimate for validity on the current network.
 *
 * @param _networkClientId - The optional network client ID to get gas fee estimates for. Defaults to the currently selected network.
 * @param enabled - Whether to enable gas fee estimation polling. Defaults to true.
 * @returns GasEstimates object
 */
export function useGasFeeEstimates(
  _networkClientId?: string,
  enabled = true,
): GasEstimates {
  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);
  const networkClientId = _networkClientId ?? selectedNetworkClientId;

  const chainId = useSelector((state) =>
    getChainIdByNetworkClientId(state, networkClientId),
  );

  const gasEstimateType = useSelector((state) =>
    getGasEstimateTypeByChainId(state, chainId),
  );
  const gasFeeEstimates = useSelector(
    (state) => getGasFeeEstimatesByChainId(state, chainId),
    isEqual,
  );
  const isGasEstimatesLoading = useSelector((state) =>
    getIsGasEstimatesLoadingByChainId(state, {
      chainId,
      networkClientId,
    }),
  );
  const isNetworkBusy = useSelector((state) =>
    getIsNetworkBusyByChainId(state, chainId),
  );

  usePolling({
    startPolling: (input: { networkClientId: string }) =>
      gasFeeStartPollingByNetworkClientId(input.networkClientId),
    stopPollingByPollingToken: gasFeeStopPollingByPollingToken,
    input: { networkClientId },
    enabled,
  });

  return {
    gasFeeEstimates,
    gasEstimateType,
    isGasEstimatesLoading,
    isNetworkBusy,
  };
}
