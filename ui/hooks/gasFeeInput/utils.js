import {
  GAS_ESTIMATE_TYPES,
  CUSTOM_GAS_ESTIMATE,
} from '../../../shared/constants/gas';

export function getGasFeeEstimate(
  field,
  gasFeeEstimates,
  gasEstimateType,
  estimateToUse,
  fallback = '0',
) {
  if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
    return gasFeeEstimates?.[estimateToUse]?.[field] ?? String(fallback);
  }
  return String(fallback);
}

export const feeParamsAreCustom = (transaction) =>
  !transaction?.userFeeLevel ||
  transaction?.userFeeLevel === CUSTOM_GAS_ESTIMATE;
