import { constant, times, uniq, zip } from 'lodash';
import BigNumber from 'bignumber.js';
import { addHexPrefix } from 'ethereumjs-util';
import {
  GasRecommendations,
  EditGasModes,
} from '../../../shared/constants/gas';
import { hexWEIToDecGWEI } from '../../../shared/lib/conversion.utils';
import { Numeric } from '../../../shared/lib/Numeric';
import {
  bnGreaterThan,
  isNullish,
  roundToDecimalPlacesRemovingExtraZeroes,
} from './util';

type GasParams = {
  gas?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
};

type GasFeeEstimateLevel = string | { suggestedMaxFeePerGas?: string };
type EditGasMode = `${EditGasModes}`;

const TEN_PERCENT_NUMERIC = new Numeric(1.1, 10);

export const gasEstimateGreaterThanGasUsedPlusTenPercent = (
  gasUsed: GasParams,
  gasFeeEstimates: Record<string, GasFeeEstimateLevel> | undefined,
  estimate: string,
): boolean | null => {
  const gasInTransaction = gasUsed?.maxFeePerGas ?? gasUsed?.gasPrice;
  const bumped = addTenPercentAndRound(gasInTransaction);
  if (!bumped) {
    return false;
  }
  const bumpedGwei = new BigNumber(hexWEIToDecGWEI(bumped));

  const levelEstimate = gasFeeEstimates?.[estimate];
  const estimateGwei =
    typeof levelEstimate === 'object'
      ? levelEstimate?.suggestedMaxFeePerGas
      : levelEstimate;
  return bnGreaterThan(estimateGwei, bumpedGwei);
};

/**
 * Simple helper to save on duplication to multiply the supplied wei hex string
 * by 1.10 to get bare minimum new gas fee.
 *
 * @param hexStringValue - hex value in wei to be incremented
 * @returns hex value in WEI 10% higher than the param.
 */
export function addTenPercentAndRound(
  hexStringValue?: string,
): string | undefined {
  if (hexStringValue === undefined) {
    return undefined;
  }
  return new Numeric(hexStringValue, 16)
    .times(TEN_PERCENT_NUMERIC)
    .round(0)
    .toPrefixedHexString();
}

export function isMetamaskSuggestedGasEstimate(estimate: string): boolean {
  return (
    estimate === GasRecommendations.high ||
    estimate === GasRecommendations.medium ||
    estimate === GasRecommendations.low
  );
}

/**
 * Formats a singular gas fee or a range of gas fees by rounding them to the
 * given precisions and then arranging them as a string.
 *
 * @param feeOrFeeRange - The fee in GWEI or range of fees in GWEI.
 * @param options - The options.
 * @param options.precision - The precision(s) to use when formatting the fee(s).
 * @returns A string which represents the formatted version of the fee or fee
 * range.
 */
export function formatGasFeeOrFeeRange(
  feeOrFeeRange: string | string[] | null | undefined,
  {
    precision: precisionOrPrecisions = 2,
  }: { precision?: number | number[] } = {},
): string | null {
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
 * @param editGasMode - One of 'speed-up', 'cancel', 'modify-in-place', or 'swaps'
 * @returns boolean
 */
export function editGasModeIsSpeedUpOrCancel(
  editGasMode?: EditGasMode,
): boolean {
  return (
    editGasMode === EditGasModes.cancel || editGasMode === EditGasModes.speedUp
  );
}

/**
 * Returns gas values for a replacement (cancel/speed-up) transaction so it is not underpriced.
 * Uses the higher of (current txParams) or (previousGas × rate) for maxFeePerGas and maxPriorityFeePerGas.
 *
 * @param txParams - Current transaction params (e.g. user-selected gas).
 * @param previousGas - Original gas at modal open; if missing, returns txParams unchanged.
 * @param rate - Multiplier for minimum replacement gas (e.g. 1.1 for CANCEL_RATE).
 * @returns Gas values safe for replacement (at least previousGas × rate).
 */
export function getGasValuesForReplacement(
  txParams: GasParams,
  previousGas: GasParams | null | undefined,
  rate: number,
): GasParams {
  // Normalize hex so BigNumber can parse (0x prefix). Values may be 0x-prefixed
  // or raw hex from .toString(16); addHexPrefix handles both (idempotent with 0x).
  const hexForBN = (v: string | number | null | undefined) =>
    v === null || v === undefined
      ? new BigNumber(0)
      : new BigNumber(addHexPrefix(String(v)));

  const effectiveGasLimit =
    txParams?.gas ??
    txParams?.gasLimit ??
    previousGas?.gas ??
    previousGas?.gasLimit;

  // Legacy (gasPrice) flow
  if (previousGas?.gasPrice && !previousGas?.maxFeePerGas) {
    const minGasPrice = new Numeric(previousGas.gasPrice, 16)
      .times(new Numeric(rate, 10))
      .round(0)
      .toPrefixedHexString();

    const gasPrice = hexForBN(txParams?.gasPrice).gte(
      new BigNumber(minGasPrice),
    )
      ? txParams.gasPrice
      : minGasPrice;

    return {
      ...txParams,
      gasPrice,
      gas: effectiveGasLimit,
      gasLimit: effectiveGasLimit,
    };
  }

  // EIP-1559 flow
  if (!previousGas?.maxFeePerGas || !previousGas?.maxPriorityFeePerGas) {
    return txParams ?? {};
  }
  const previousMaxFeePerGas = new Numeric(previousGas.maxFeePerGas, 16)
    .times(new Numeric(rate, 10))
    .round(0)
    .toPrefixedHexString();
  const previousMaxPriorityFeePerGas = new Numeric(
    previousGas.maxPriorityFeePerGas,
    16,
  )
    .times(new Numeric(rate, 10))
    .round(0)
    .toPrefixedHexString();

  const maxFeePerGas = hexForBN(txParams?.maxFeePerGas).gte(
    new BigNumber(previousMaxFeePerGas),
  )
    ? txParams.maxFeePerGas
    : previousMaxFeePerGas;
  const maxPriorityFeePerGas = hexForBN(txParams?.maxPriorityFeePerGas).gte(
    new BigNumber(previousMaxPriorityFeePerGas),
  )
    ? txParams.maxPriorityFeePerGas
    : previousMaxPriorityFeePerGas;

  return {
    ...txParams,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas: effectiveGasLimit,
    gasLimit: effectiveGasLimit,
  };
}
