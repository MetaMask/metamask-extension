import isEqual from 'lodash/isEqual';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import {
  getGasEstimateTypeByChainId,
  getGasFeeEstimatesByChainId,
  getIsGasEstimatesLoadingByChainId,
  getIsNetworkBusyByChainId,
} from '../ducks/metamask/metamask';
import {
  gasFeeStartPollingByNetworkClientId,
  gasFeeStopPollingByPollingToken,
  getNetworkConfigurationByNetworkClientId,
} from '../store/actions';
import { getSelectedNetworkClientId } from '../selectors';
import usePolling from './usePolling';

/**
 * @typedef {object} GasEstimates
 * @property {import(
 *   '@metamask/gas-fee-controller'
 * ).GasFeeState['gasFeeEstimates']} gasFeeEstimates - The estimate object
 * @property {object} gasEstimateType - The type of estimate provided
 * @property {boolean} isGasEstimateLoading - indicates whether the gas
 *  estimates are currently loading.
 * @property {boolean} isNetworkBusy - indicates whether the network is busy.
 */

/**
 * Gets the current gasFeeEstimates from state and begins polling for new
 * estimates. When this hook is removed from the tree it will signal to the
 * GasFeeController that it is done requiring new gas estimates. Also checks
 * the returned gas estimate for validity on the current network.
 *
 * @param _networkClientId - The optional network client ID to get gas fee estimates for. Defaults to the currently selected network.
 * @returns {GasEstimates} GasEstimates object
 */
export function useGasFeeEstimates(_networkClientId) {
  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);
  const networkClientId = _networkClientId ?? selectedNetworkClientId;

  const [chainId, setChainId] = useState('');

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

  useEffect(() => {
    let isMounted = true;
    getNetworkConfigurationByNetworkClientId(networkClientId).then(
      (networkConfig) => {
        if (networkConfig && isMounted) {
          setChainId(networkConfig.chainId);
        }
      },
    );

    return () => {
      isMounted = false;
    };
  }, [networkClientId]);

  usePolling({
    startPollingByNetworkClientId: gasFeeStartPollingByNetworkClientId,
    stopPollingByPollingToken: gasFeeStopPollingByPollingToken,
    networkClientId,
  });

  return {
    gasFeeEstimates,
    gasEstimateType,
    isGasEstimatesLoading,
    isNetworkBusy,
  };
}
