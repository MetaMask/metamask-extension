import { constant, times, uniq, zip } from 'lodash';
import BigNumber from 'bignumber.js';
import {
  GasRecommendations,
  EditGasModes,
} from '../../../shared/constants/gas';
import { hexWEIToDecGWEI } from '../../../shared/modules/conversion.utils';
import { Numeric } from '../../../shared/modules/Numeric';
import {
  bnGreaterThan,
  isNullish,
  roundToDecimalPlacesRemovingExtraZeroes,
} from './util';

const TEN_PERCENT_NUMERIC = new Numeric(1.1, 10);

export const gasEstimateGreaterThanGasUsedPlusTenPercent = (
  gasUsed,
  gasFeeEstimates,
  estimate,
) => {
  let { maxFeePerGas: maxFeePerGasInTransaction } = gasUsed;
  maxFeePerGasInTransaction = new BigNumber(
    hexWEIToDecGWEI(addTenPercentAndRound(maxFeePerGasInTransaction)),
  );

  const maxFeePerGasFromEstimate =
    gasFeeEstimates[estimate]?.suggestedMaxFeePerGas;
  return bnGreaterThan(maxFeePerGasFromEstimate, maxFeePerGasInTransaction);
};

/**
 * Simple helper to save on duplication to multiply the supplied wei hex string
 * by 1.10 to get bare minimum new gas fee.
 *
 * @param {string | undefined} hexStringValue - hex value in wei to be incremented
 * @returns {string | undefined} hex value in WEI 10% higher than the param.
 */
export function addTenPercentAndRound(hexStringValue) {
  if (hexStringValue === undefined) {
    return undefined;
  }
  return new Numeric(hexStringValue, 16)
    .times(TEN_PERCENT_NUMERIC)
    .round(0)
    .toPrefixedHexString();
}

export function isMetamaskSuggestedGasEstimate(estimate) {
  return [
    GasRecommendations.high,
    GasRecommendations.medium,
    GasRecommendations.low,
  ].includes(estimate);
}

/**
 * Formats a singular gas fee or a range of gas fees by rounding them to the
 * given precisions and then arranging them as a string.
 *
 * @param {string | [string, string] | null | undefined} feeOrFeeRange - The fee
 * in GWEI or range of fees in GWEI.
 * @param {object} options - The options.
 * @param {number | [number, number]} options.precision - The precision(s) to
 * use when formatting the fee(s).
 * @returns A string which represents the formatted version of the fee or fee
 * range.
 */
export function formatGasFeeOrFeeRange(
  feeOrFeeRange,
  { precision: precisionOrPrecisions = 2 } = {},
) {
  if (
    isNullish(feeOrFeeRange) ||
    (Array.isArray(feeOrFeeRange) && feeOrFeeRange.length === 0)
  ) {
    return null;
  }

  const range = Array.isArray(feeOrFeeRange)
    ? feeOrFeeRange.slice(0, 2)
    : [feeOrFeeRange];
  const precisions = Array.isArray(precisionOrPrecisions)
    ? precisionOrPrecisions.slice(0, 2)
    : times(range.length, constant(precisionOrPrecisions));
  const formattedRange = uniq(
    zip(range, precisions).map(([fee, precision]) => {
      return precision === undefined
        ? fee
        : roundToDecimalPlacesRemovingExtraZeroes(fee, precision);
    }),
  ).join(' - ');

  return `${formattedRange} GWEI`;
}

/**
 * Helper method for determining whether an edit gas mode is either a speed up or cancel transaction
 *
 * @param {string | undefined} editGasMode - One of 'speed-up', 'cancel', 'modify-in-place', or 'swaps'
 * @returns boolean
 */
export function editGasModeIsSpeedUpOrCancel(editGasMode) {
  return (
    editGasMode === EditGasModes.cancel || editGasMode === EditGasModes.speedUp
  );
}
