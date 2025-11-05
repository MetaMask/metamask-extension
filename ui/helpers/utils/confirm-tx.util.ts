import currencyFormatter from 'currency-formatter';
import currencies from 'currency-formatter/currencies';
import { BigNumber } from 'bignumber.js';

import { TransactionMeta } from '@metamask/transaction-controller';
import { Numeric } from '../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../shared/constants/common';

export function getHexGasTotal({ gasLimit = '0x0', gasPrice = '0x0' }): string {
  return new Numeric(gasLimit, 16)
    .times(new Numeric(gasPrice, 16))
    .toPrefixedHexString();
}

export function addEth(firstValue: string, ...otherValues: string[]): string {
  return otherValues
    .reduce(
      (numericAcc, ethAmount) => {
        return numericAcc.add(new Numeric(ethAmount, 10)).round(6);
      },
      new Numeric(firstValue, 10),
    )
    .toString();
}

export function addFiat(firstValue: string, ...otherValues: string[]): string {
  return otherValues
    .reduce(
      (numericAcc, fiatAmount) => {
        return numericAcc.add(new Numeric(fiatAmount, 10)).round(2);
      },
      new Numeric(firstValue, 10),
    )
    .toString();
}

export function getTransactionFee({
  value,
  fromCurrency = EtherDenomination.ETH,
  toCurrency,
  conversionRate,
  numberOfDecimals,
}: {
  value: string;
  fromCurrency: EtherDenomination;
  toCurrency: string;
  conversionRate: number;
  numberOfDecimals: number;
}): string {
  let fee = new Numeric(value, 16, EtherDenomination.WEI)
    .toDenomination(EtherDenomination.ETH)
    .toBase(10);

  if (fromCurrency !== toCurrency && conversionRate) {
    fee = fee.applyConversionRate(conversionRate);
  }
  return fee.round(numberOfDecimals).toString();
}

/**
 * @deprecated Use formatters from `@metamask/core` instead
 * @param value
 * @param currencyCode
 * @param precision
 */
export function formatCurrency(
  value: string,
  currencyCode: string,
  precision?: number,
): string {
  const upperCaseCurrencyCode = currencyCode.toUpperCase();

  return currencies.find((currency) => currency.code === upperCaseCurrencyCode)
    ? currencyFormatter.format(Number(value), {
        code: upperCaseCurrencyCode,
        precision,
      })
    : value;
}

export function convertTokenToFiat({
  value,
  fromCurrency = EtherDenomination.ETH,
  toCurrency,
  conversionRate,
  contractExchangeRate,
}: {
  value: string;
  fromCurrency: EtherDenomination;
  toCurrency: string;
  conversionRate: number;
  contractExchangeRate: number;
}): string {
  const totalExchangeRate = conversionRate * contractExchangeRate;

  let tokenInFiat = new Numeric(value, 10);

  if (fromCurrency !== toCurrency && totalExchangeRate) {
    tokenInFiat = tokenInFiat.applyConversionRate(totalExchangeRate);
  }

  return tokenInFiat.round(2).toString();
}

/**
 * Rounds the given decimal string to 4 significant digits.
 *
 * @param decimalString - The base-ten number to round.
 * @returns The rounded number, or the original number if no
 * rounding was necessary.
 */
export function roundExponential(decimalString: string): string {
  const PRECISION = 4;
  const bigNumberValue = new BigNumber(decimalString);

  // In JS, numbers with exponentials greater than 20 get displayed as an exponential.
  return bigNumberValue.e > 20
    ? bigNumberValue.toPrecision(PRECISION)
    : decimalString;
}

/**
 * Formats network fees with dynamic precision to avoid showing $0.00 for non-zero fees.
 * If fees are less than $0.01, increases decimal places up to 4 until the first non-zero digit is shown.
 * If fees are non-zero but smaller than $0.0001, rounds up to $0.0001.
 *
 * @param stringifiedDecAmount - The fee amount as a string
 * @param currency - The currency code (e.g., 'USD')
 * @returns Formatted currency string with appropriate precision
 */
export function formatNetworkFee(
  stringifiedDecAmount: string | null | undefined,
  currency: string,
): string | undefined {
  if (!stringifiedDecAmount) {
    return undefined;
  }

  const amount = new BigNumber(stringifiedDecAmount);

  // If amount is zero, return formatted zero
  if (amount.isZero()) {
    return formatCurrency(amount.toString(), currency, 2);
  }

  // If amount is >= $0.01, use standard 2 decimal places
  if (amount.gte(0.01)) {
    return formatCurrency(amount.toString(), currency, 2);
  }

  // For amounts < $0.01, find the precision that shows the first non-zero digit
  // Try precision from 2 to 4 (max allowed)
  for (let precision = 2; precision <= 4; precision++) {
    // Scale the amount by 10^precision to move the target digit to the ones place
    // Example: 0.0005 with precision 3 → 0.5 (moves 3rd decimal to ones place)
    const scaleFactor = new BigNumber(10).pow(precision);
    const scaledAmount = amount.times(scaleFactor);

    // Round using ROUND_HALF_UP to match currency formatter's rounding behavior
    // If the rounded value is non-zero, this precision will show a non-zero digit
    const roundedValue = scaledAmount.round(0, BigNumber.ROUND_HALF_UP);

    if (roundedValue.gt(0)) {
      return formatCurrency(amount.toString(), currency, precision);
    }
  }

  // If after 4 decimal places it's still showing as zero but original amount > 0,
  // round up to $0.0001
  if (amount.gt(0)) {
    return formatCurrency('0.0001', currency, 4);
  }

  // Fallback to 2 decimal places
  return formatCurrency(amount.toString(), currency, 2);
}

export function areDappSuggestedAndTxParamGasFeesTheSame(
  txData: TransactionMeta,
): boolean {
  const { txParams, dappSuggestedGasFees } = txData ?? {};
  const {
    gasPrice: txParamsGasPrice,
    maxFeePerGas: txParamsMaxFeePerGas,
    maxPriorityFeePerGas: txParamsMaxPriorityFeePerGas,
  } = txParams || {};
  const {
    gasPrice: dappGasPrice,
    maxFeePerGas: dappMaxFeePerGas,
    maxPriorityFeePerGas: dappMaxPriorityFeePerGas,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  } = dappSuggestedGasFees || {};

  const txParamsDoesNotHaveFeeProperties =
    !txParamsGasPrice && !txParamsMaxFeePerGas && !txParamsMaxPriorityFeePerGas;
  const dappDidNotSuggestFeeProperties =
    !dappGasPrice && !dappMaxFeePerGas && !dappMaxPriorityFeePerGas;
  if (txParamsDoesNotHaveFeeProperties || dappDidNotSuggestFeeProperties) {
    return false;
  }

  const txParamsGasPriceMatchesDappSuggestedGasPrice =
    txParamsGasPrice && txParamsGasPrice === dappGasPrice;
  const txParamsEIP1559FeesMatchDappSuggestedGasPrice = [
    txParamsMaxFeePerGas,
    txParamsMaxPriorityFeePerGas,
  ].every((fee) => fee === dappGasPrice);
  const txParamsEIP1559FeesMatchDappSuggestedEIP1559Fees =
    txParamsMaxFeePerGas &&
    txParamsMaxFeePerGas === dappMaxFeePerGas &&
    txParamsMaxPriorityFeePerGas === dappMaxPriorityFeePerGas;

  return Boolean(
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    txParamsGasPriceMatchesDappSuggestedGasPrice ||
      txParamsEIP1559FeesMatchDappSuggestedGasPrice ||
      txParamsEIP1559FeesMatchDappSuggestedEIP1559Fees,
  );
}
