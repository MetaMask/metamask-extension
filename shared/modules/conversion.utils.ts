import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import BN from 'bn.js';
import { addHexPrefix } from 'ethereumjs-util';
import { EtherDenomination } from '../constants/common';
import { Numeric, NumericValue } from './Numeric';

export function decGWEIToHexWEI(decGWEI: NumericValue) {
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

export function multiplyHexes(aHexWEI: Hex, bHexWEI: Hex): Hex {
  return new Numeric(aHexWEI, 16)
    .times(new Numeric(bHexWEI, 16))
    .round(6, BigNumber.ROUND_HALF_DOWN)
    .toString() as Hex;
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
  ethTotal: NumericValue,
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
}: {
  value: NumericValue;
  conversionRate?: number;
  fromDenomination?: EtherDenomination;
  fromCurrency?: string;
  invertConversionRate?: boolean;
}) {
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
}: {
  value: NumericValue;
  conversionRate?: number;
  fromCurrency?: EtherDenomination | string;
  numberOfDecimals?: number;
}) {
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
}: {
  value: NumericValue;
  fromCurrency?: EtherDenomination | string;
  toCurrency?: EtherDenomination | string;
  conversionRate?: number;
  numberOfDecimals?: number;
  toDenomination?: EtherDenomination;
}) {
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

export function sumDecimals(first: string, ...args: string[]) {
  const firstValue = new Numeric(first, 10);
  const total = args.reduce(
    (acc, hexAmount) => acc.add(new Numeric(hexAmount, 10)),
    firstValue,
  );

  return total;
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

export function decimalToPrefixedHex(
  decimal: number | string | BigNumber | BN,
): Hex {
  return new Numeric(decimal, 10).toPrefixedHexString() as Hex;
}

export function hexToDecimal(hexValue: number | string | BigNumber | BN) {
  return new Numeric(hexValue, 16).toBase(10).toString();
}
