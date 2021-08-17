import { useSelector } from 'react-redux';
import {
  getEstimatedGasFeeTimeBounds,
  getGasEstimateType,
  getGasFeeEstimates,
  getIsGasEstimatesLoading,
} from '../ducks/metamask/metamask';
import { useSafeGasEstimatePolling } from './useSafeGasEstimatePolling';

/**
 * @typedef {object} GasEstimates
 * @property {GasEstimateTypes} gasEstimateType - The type of estimate provided
 * @property {import(
 *   '@metamask/controllers'
 * ).GasFeeState['gasFeeEstimates']} gasFeeEstimates - The estimate object
 * @property {import(
 *   '@metamask/controllers'
 * ).GasFeeState['estimatedGasFeeTimeBounds']} [estimatedGasFeeTimeBounds] -
 *  estimated time boundaries for fee-market type estimates
 * @property {boolean} isGasEstimateLoading - indicates whether the gas
 *  estimates are currently loading.
 */

/**
 * Gets the current gasFeeEstimates from state and begins polling for new
 * estimates. When this hook is removed from the tree it will signal to the
 * GasFeeController that it is done requiring new gas estimates. Also checks
 * the returned gas estimate for validity on the current network.
 *
 * @returns {GasFeeEstimates} - GasFeeEstimates object
 */
export function useGasFeeEstimates() {
  const gasEstimateType = useSelector(getGasEstimateType);
  const gasFeeEstimates = useSelector(getGasFeeEstimates);
  const estimatedGasFeeTimeBounds = useSelector(getEstimatedGasFeeTimeBounds);
  const isGasEstimatesLoading = useSelector(getIsGasEstimatesLoading);
  useSafeGasEstimatePolling();

  return {
    gasFeeEstimates,
    gasEstimateType,
    estimatedGasFeeTimeBounds,
    isGasEstimatesLoading,
  };
}
