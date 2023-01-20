/**
 * Currency Conversion Utility
 * This utility function can be used for converting currency related values within metamask.
 * The caller should be able to pass it a value, along with information about the value's
 * numeric base, denomination and currency, and the desired numeric base, denomination and
 * currency. It should return a single value.
 *
 * @param {(number | string | BN)} value - The value to convert.
 * @param {object} [options] - Options to specify details of the conversion
 * @param {string} [options.fromCurrency = EtherDenomination.ETH | 'USD'] - The currency of the passed value
 * @param {string} [options.toCurrency = EtherDenomination.ETH | 'USD'] - The desired currency of the result
 * @param {string} [options.fromNumericBase = 'hex' | 'dec' | 'BN'] - The numeric basic of the passed value.
 * @param {string} [options.toNumericBase = 'hex' | 'dec' | 'BN'] - The desired numeric basic of the result.
 * @param {string} [options.fromDenomination = EtherDenomination.WEI] - The denomination of the passed value
 * @param {string} [options.numberOfDecimals] - The desired number of decimals in the result
 * @param {string} [options.roundDown] - The desired number of decimals to round down to
 * @param {number} [options.conversionRate] - The rate to use to make the fromCurrency -> toCurrency conversion
 * @returns {(number | string | BN)}
 *
 * The utility passes value along with the options as a single object to the `converter` function.
 * `converter` conditional modifies the supplied `value` property, depending
 * on the accompanying options.
 */

import { BigNumber } from 'bignumber.js';

import { addHexPrefix, BN } from 'ethereumjs-util';
import { EtherDenomination } from '../constants/common';
import { Numeric } from './Numeric';

/**
 * Defines the base type of numeric value
 */
export type NumericBase = 'hex' | 'dec' | undefined;

/**
 * Defines which type of denomination a value is in
 */

interface ConversionUtilParams {
  value: string | number | BN | BigNumber;
  fromNumericBase: NumericBase;
  fromDenomination?: EtherDenomination;
  fromCurrency?: string;
  toNumericBase?: NumericBase;
  toDenomination?: EtherDenomination;
  toCurrency?: string;
  numberOfDecimals?: number;
  conversionRate?: number | BigNumber;
  invertConversionRate?: boolean;
  roundDown?: number;
}

export function decGWEIToHexWEI(decGWEI: number) {
  return new Numeric(decGWEI, 10, EtherDenomination.GWEI)
    .toBase(16)
    .toDenomination(EtherDenomination.WEI)
    .toString();
}

export function subtractHexes(aHexWEI: string, bHexWEI: string) {
  return new Numeric(aHexWEI, 16)
    .minus(new Numeric(bHexWEI, 16))
    .round(6, BigNumber.ROUND_HALF_DOWN)
    .toString();
}

export function addHexes(aHexWEI: string, bHexWEI: string) {
  return new Numeric(aHexWEI, 16)
    .add(new Numeric(bHexWEI, 16))
    .round(6, BigNumber.ROUND_HALF_DOWN)
    .toString();
}

export function decWEIToDecETH(decWEI: string) {
  return new Numeric(decWEI, 10, EtherDenomination.WEI)
    .toDenomination(EtherDenomination.ETH)
    .toString();
}

export function hexWEIToDecETH(hexWEI: string) {
  return new Numeric(hexWEI, 16, EtherDenomination.WEI)
    .toDenomination(EtherDenomination.ETH)
    .toBase(10)
    .toString();
}

export function decEthToConvertedCurrency(
  ethTotal: ConversionUtilParams['value'],
  convertedCurrency?: string,
  conversionRate?: number,
) {
  let numeric = new Numeric(ethTotal, 10, EtherDenomination.ETH);

  if (convertedCurrency !== EtherDenomination.ETH) {
    numeric = numeric.applyConversionRate(conversionRate);
  }

  return numeric.round(2);
}

export function getWeiHexFromDecimalValue({
  value,
  conversionRate = 1,
  fromDenomination,
  fromCurrency,
  invertConversionRate = false,
}: Pick<
  ConversionUtilParams,
  | 'value'
  | 'fromCurrency'
  | 'conversionRate'
  | 'fromDenomination'
  | 'invertConversionRate'
>) {
  let numeric = new Numeric(value, 10, fromDenomination);
  if (fromCurrency !== EtherDenomination.ETH) {
    numeric = numeric.applyConversionRate(conversionRate, invertConversionRate);
  }
  return numeric.toBase(16).toDenomination(EtherDenomination.WEI).toString();
}

/**
 * Converts a BN object to a hex string with a '0x' prefix
 *
 * @param inputBn - The BN to convert to a hex string
 * @returns A '0x' prefixed hex string
 */
export function bnToHex(inputBn: BN) {
  return addHexPrefix(inputBn.toString(16));
}

export function getEthConversionFromWeiHex({
  value,
  fromCurrency = EtherDenomination.ETH,
  conversionRate,
  numberOfDecimals = 6,
}: Pick<
  ConversionUtilParams,
  'value' | 'fromCurrency' | 'conversionRate' | 'numberOfDecimals'
>) {
  const denominations = [
    EtherDenomination.ETH,
    EtherDenomination.GWEI,
    EtherDenomination.WEI,
  ];

  let nonZeroDenomination;

  for (let i = 0; i < denominations.length; i++) {
    const convertedValue = getValueFromWeiHex({
      value,
      conversionRate,
      fromCurrency,
      toCurrency: fromCurrency,
      numberOfDecimals,
      toDenomination: denominations[i],
    });

    if (convertedValue !== '0' || i === denominations.length - 1) {
      nonZeroDenomination = `${convertedValue} ${denominations[i]}`;
      break;
    }
  }

  return nonZeroDenomination;
}

export function getValueFromWeiHex({
  value,
  fromCurrency = EtherDenomination.ETH,
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination = EtherDenomination.ETH,
}: Pick<
  ConversionUtilParams,
  | 'value'
  | 'fromCurrency'
  | 'toCurrency'
  | 'conversionRate'
  | 'numberOfDecimals'
  | 'toDenomination'
>) {
  let numeric = new Numeric(value, 16, EtherDenomination.WEI);
  if (fromCurrency !== toCurrency) {
    numeric = numeric.applyConversionRate(conversionRate);
  }
  return numeric
    .toBase(10)
    .toDenomination(toDenomination)
    .round(numberOfDecimals, BigNumber.ROUND_HALF_DOWN)
    .toString();
}

export function sumHexes(first: string, ...args: string[]) {
  const firstValue = new Numeric(first, 16);
  const total = args.reduce(
    (acc, hexAmount) => acc.add(new Numeric(hexAmount, 16)),
    firstValue,
  );

  return total.toPrefixedHexString();
}

export function hexWEIToDecGWEI(value: number | string | BigNumber | BN) {
  return new Numeric(value, 16, EtherDenomination.WEI)
    .toBase(10)
    .toDenomination(EtherDenomination.GWEI)
    .toString();
}

export function decimalToHex(decimal: number | string | BigNumber | BN) {
  return new Numeric(decimal, 10).toBase(16).toString();
}

export function hexToDecimal(hexValue: number | string | BigNumber | BN) {
  return new Numeric(hexValue, 16).toBase(10).toString();
}
