import {
  GasEstimateTypes,
  CUSTOM_GAS_ESTIMATE,
} from '../../../shared/constants/gas';

export function getGasFeeEstimate(
  field,
  gasFeeEstimates,
  gasEstimateType,
  estimateToUse,
  fallback = '0',
) {
  if (gasEstimateType === GasEstimateTypes.feeMarket) {
    return gasFeeEstimates?.[estimateToUse]?.[field] ?? String(fallback);
  }
  return String(fallback);
}

export const feeParamsAreCustom = (transaction) =>
  !transaction?.userFeeLevel ||
  transaction?.userFeeLevel === CUSTOM_GAS_ESTIMATE;
