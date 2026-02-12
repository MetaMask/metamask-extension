/**
 * MUSD Conversion Utilities
 *
 * Utility functions for mUSD amount conversion, formatting, and calculations.
 * These functions handle the conversion between human-readable amounts and wei values,
 * as well as fee calculations and output amount projections.
 */

import BigNumber from 'bignumber.js';
import { MUSD_DECIMALS, MUSD_CONVERSION_APY } from '../../constants/musd';
import type { RelayFees } from '../../../ui/pages/musd-conversion/types';

// Configure BigNumber for precise decimal arithmetic
BigNumber.config({ DECIMAL_PLACES: 18, ROUNDING_MODE: BigNumber.ROUND_DOWN });

// ============================================================================
// Token Amount Calculations
// ============================================================================

/**
 * Convert a token amount from its smallest unit (wei) to human-readable format.
 * This is the inverse of parseMusdAmountToWei.
 *
 * @param value - The amount in smallest unit (wei)
 * @param decimals - The token's decimal places
 * @returns BigNumber representing the human-readable amount
 * @example
 * calcTokenAmount('1000000', 6) // Returns BigNumber(1) for mUSD
 * calcTokenAmount('1000000000000000000', 18) // Returns BigNumber(1) for ETH
 */
export function calcTokenAmount(
  value: string | number | BigNumber,
  decimals: number,
): BigNumber {
  const divisor = new BigNumber(10).pow(decimals);
  return new BigNumber(value).dividedBy(divisor);
}

/**
 * Convert a human-readable mUSD amount to wei (smallest unit).
 * Uses MUSD_DECIMALS (6) for the conversion.
 *
 * @param amount - Human-readable amount (e.g., '100' for $100)
 * @returns Wei string representation
 * @example
 * convertToMusdAmount('100') // Returns '100000000'
 * convertToMusdAmount('0.01') // Returns '10000'
 */
export function convertToMusdAmount(amount: string | number): string {
  const multiplier = new BigNumber(10).pow(MUSD_DECIMALS);
  const result = new BigNumber(amount)
    .times(multiplier)
    .integerValue(BigNumber.ROUND_DOWN);
  return result.toString();
}

/**
 * Convert mUSD wei to human-readable amount.
 * Uses MUSD_DECIMALS (6) for the conversion.
 *
 * @param weiAmount - Amount in wei (smallest unit)
 * @returns Human-readable amount string
 * @example
 * convertFromMusdAmount('100000000') // Returns '100'
 * convertFromMusdAmount('10000') // Returns '0.01'
 */
export function convertFromMusdAmount(weiAmount: string | number): string {
  return calcTokenAmount(weiAmount, MUSD_DECIMALS).toString();
}

/**
 * Parse a human-readable amount to mUSD wei.
 * Alias for convertToMusdAmount for semantic clarity.
 *
 * @param amount - Human-readable amount
 * @returns Wei string representation
 */
export function parseMusdAmountToWei(amount: string | number): string {
  return convertToMusdAmount(amount);
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format an amount string to a limited number of decimal places.
 * Uses truncation (rounding down) to avoid showing more than the user entered.
 *
 * @param amount - Amount to format
 * @param maxDecimals - Maximum decimal places (default: 2)
 * @returns Formatted amount string
 * @example
 * formatMusdAmount('100.123456') // Returns '100.12'
 * formatMusdAmount('100.123456', 4) // Returns '100.1234'
 */
export function formatMusdAmount(
  amount: string | number,
  maxDecimals: number = 2,
): string {
  return limitToMaximumDecimalPlaces(amount, maxDecimals);
}

/**
 * Limit a number to maximum decimal places.
 * Truncates (rounds down) excess decimals.
 *
 * @param value - Value to limit
 * @param maxDecimals - Maximum decimal places
 * @returns Formatted string with limited decimals
 * @example
 * limitToMaximumDecimalPlaces('100.999', 2) // Returns '100.99'
 */
export function limitToMaximumDecimalPlaces(
  value: string | number | BigNumber,
  maxDecimals: number,
): string {
  const bn = new BigNumber(value);

  // If no decimals, return as-is
  if (bn.decimalPlaces() === 0) {
    return bn.toString();
  }

  return bn.decimalPlaces(maxDecimals, BigNumber.ROUND_DOWN).toString();
}

// ============================================================================
// Hex/Decimal Conversions
// ============================================================================

/**
 * Convert a hex string to decimal string.
 *
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Decimal string
 * @example
 * hexToDecimal('0x64') // Returns '100'
 * hexToDecimal('0x5f5e100') // Returns '100000000'
 */
export function hexToDecimal(hex: string): string {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return new BigNumber(cleanHex, 16).toString(10);
}

/**
 * Convert a decimal string or number to hex with 0x prefix.
 *
 * @param decimal - Decimal value
 * @returns Hex string with 0x prefix
 * @example
 * decimalToHex('100') // Returns '0x64'
 * decimalToHex(100000000) // Returns '0x5f5e100'
 */
export function decimalToHex(decimal: string | number): string {
  const bn = new BigNumber(decimal);
  if (bn.isZero()) {
    return '0x0';
  }
  return `0x${bn.toString(16)}`;
}

// ============================================================================
// Claim Amount Conversion (for Merkl Rewards)
// ============================================================================

/**
 * Parameters for converting mUSD claim amount.
 */
export type ConvertMusdClaimParams = {
  /** Raw claim amount from decodeMerklClaimAmount (wei string) */
  claimAmountRaw: string;
  /** Native-to-user-currency conversion rate (e.g., ETH to EUR) */
  conversionRate: BigNumber | number;
  /** Native-to-USD conversion rate (e.g., ETH to USD) */
  usdConversionRate: number;
};

/**
 * Result of mUSD claim amount conversion.
 */
export type ConvertMusdClaimResult = {
  /** Claim amount in mUSD decimals (not fiat converted) */
  claimAmountDecimal: BigNumber;
  /** Fiat value in user's currency (or USD if rates unavailable) */
  fiatValue: BigNumber;
  /** Whether the fiat value was converted to user's currency (false = USD fallback) */
  isConverted: boolean;
};

/**
 * Convert raw mUSD claim amount to display values.
 * mUSD is a stablecoin pegged to USD (1 mUSD = $1).
 * Converts to user's currency using: USD * (nativeToUserCurrency / nativeToUSD)
 *
 * @param params - Conversion parameters
 * @param params.claimAmountRaw
 * @param params.conversionRate
 * @param params.usdConversionRate
 * @returns Converted amounts and conversion status
 * @example
 * convertMusdClaimAmount({
 *   claimAmountRaw: '1000000', // 1 mUSD
 *   conversionRate: 0.85, // GBP rate
 *   usdConversionRate: 1.0,
 * }) // Returns { claimAmountDecimal: 1, fiatValue: 0.85, isConverted: true }
 */
export function convertMusdClaimAmount({
  claimAmountRaw,
  conversionRate,
  usdConversionRate,
}: ConvertMusdClaimParams): ConvertMusdClaimResult {
  const claimAmountDecimal = calcTokenAmount(claimAmountRaw, MUSD_DECIMALS);
  const conversionRateBN =
    conversionRate instanceof BigNumber
      ? conversionRate
      : new BigNumber(conversionRate);

  if (usdConversionRate > 0 && conversionRateBN.isGreaterThan(0)) {
    const usdToUserCurrencyRate = conversionRateBN.dividedBy(usdConversionRate);
    const fiatValue = claimAmountDecimal.times(usdToUserCurrencyRate);
    return { claimAmountDecimal, fiatValue, isConverted: true };
  }

  // Fallback: no conversion rates available, use 1:1 with USD
  return {
    claimAmountDecimal,
    fiatValue: claimAmountDecimal,
    isConverted: false,
  };
}

// ============================================================================
// Output Amount Calculations
// ============================================================================

/**
 * Parameters for calculating mUSD output amount.
 */
export type GetMusdOutputParams = {
  /** Input amount in USD */
  inputAmountUsd: string;
  /** Bonus percentage (default: MUSD_CONVERSION_APY) */
  bonusPercentage?: number;
  /** Fee amount in USD */
  feeAmountUsd?: string;
};

/**
 * Result of mUSD output calculation.
 */
export type GetMusdOutputResult = {
  /** Output amount in USD (mUSD is 1:1 with USD) */
  outputAmountUsd: string;
  /** Output amount in wei */
  outputAmountWei: string;
};

/**
 * Calculate the expected mUSD output amount given an input amount.
 * Applies bonus percentage and subtracts fees.
 *
 * Formula: output = input * (1 + bonusPercentage/100) - fees
 *
 * @param params - Calculation parameters
 * @param params.inputAmountUsd
 * @param params.bonusPercentage
 * @param params.feeAmountUsd
 * @returns Expected output amounts
 * @example
 * getMusdOutputAmount({
 *   inputAmountUsd: '100',
 *   bonusPercentage: 3,
 *   feeAmountUsd: '0.10',
 * }) // Returns { outputAmountUsd: '102.9', outputAmountWei: '102900000' }
 */
export function getMusdOutputAmount({
  inputAmountUsd,
  bonusPercentage = MUSD_CONVERSION_APY,
  feeAmountUsd = '0',
}: GetMusdOutputParams): GetMusdOutputResult {
  const input = new BigNumber(inputAmountUsd);
  const fees = new BigNumber(feeAmountUsd);

  // Apply bonus: input * (1 + bonus/100)
  const bonusMultiplier = new BigNumber(1).plus(
    new BigNumber(bonusPercentage).dividedBy(100),
  );

  // Calculate output: (input * bonusMultiplier) - fees
  const outputAmountUsd = input.times(bonusMultiplier).minus(fees);

  // Convert to wei
  const outputAmountWei = convertToMusdAmount(outputAmountUsd.toString());

  return {
    outputAmountUsd: outputAmountUsd.toString(),
    outputAmountWei,
  };
}

// ============================================================================
// Fee Calculations
// ============================================================================

/**
 * Calculate total fees from Relay fee breakdown.
 * Sums gas fee and relayer fee for the total user cost.
 *
 * @param fees - Relay fees object
 * @returns Total fee amount in USD as string
 * @example
 * calculateTotalFees({
 *   gas: { amountUsd: '0.50' },
 *   relayer: { amountUsd: '0.25' },
 *   ...
 * }) // Returns '0.75'
 */
export function calculateTotalFees(fees: Partial<RelayFees>): string {
  let total = new BigNumber(0);

  // Sum primary fee components (gas + relayer)
  if (fees.gas?.amountUsd) {
    total = total.plus(new BigNumber(fees.gas.amountUsd));
  }

  if (fees.relayer?.amountUsd) {
    total = total.plus(new BigNumber(fees.relayer.amountUsd));
  }

  return total.toString();
}

/**
 * Calculate the net output after fees.
 *
 * @param grossOutput - Gross output amount
 * @param fees - Total fees to subtract
 * @returns Net output amount
 */
export function calculateNetOutput(
  grossOutput: string | number,
  fees: string | number,
): string {
  return new BigNumber(grossOutput).minus(new BigNumber(fees)).toString();
}

// ============================================================================
// Token Conversion Helpers
// ============================================================================

/**
 * Convert an amount from one token to mUSD based on exchange rate.
 *
 * @param amount - Amount in source token
 * @param sourceDecimals - Source token decimals
 * @param exchangeRate - Exchange rate (source/USD)
 * @returns Amount in mUSD wei
 */
export function convertTokenToMusd(
  amount: string,
  sourceDecimals: number,
  exchangeRate: number,
): string {
  // Convert to USD value first
  const tokenAmount = calcTokenAmount(amount, sourceDecimals);
  const usdValue = tokenAmount.times(exchangeRate);

  // Convert USD to mUSD wei
  return convertToMusdAmount(usdValue.toString());
}

/**
 * Format a USD amount for display.
 *
 * @param amount - Amount in USD
 * @param options - Formatting options
 * @param options.prefix
 * @param options.maxDecimals
 * @returns Formatted string
 */
export function formatUsdAmount(
  amount: string | number,
  options: { prefix?: string; maxDecimals?: number } = {},
): string {
  const { prefix = '$', maxDecimals = 2 } = options;
  const formatted = limitToMaximumDecimalPlaces(amount, maxDecimals);
  return `${prefix}${formatted}`;
}
