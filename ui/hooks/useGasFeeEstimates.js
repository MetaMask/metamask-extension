import isEqual from 'lodash/isEqual';
import { useSelector } from 'react-redux';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  getIsGasEstimatesLoading,
  getIsNetworkBusy,
} from '../ducks/metamask/metamask';
import { useSafeGasEstimatePolling } from './useSafeGasEstimatePolling';

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
 * @returns {GasEstimates} GasEstimates object
 */
export function useGasFeeEstimates() {
  const gasEstimateType = useSelector(getGasEstimateType);
  const gasFeeEstimates = useSelector(getGasFeeEstimates, isEqual);
  const isGasEstimatesLoading = useSelector(getIsGasEstimatesLoading);
  const isNetworkBusy = useSelector(getIsNetworkBusy);
  useSafeGasEstimatePolling();

  return {
    gasFeeEstimates,
    gasEstimateType,
    isGasEstimatesLoading,
    isNetworkBusy,
  };
}
