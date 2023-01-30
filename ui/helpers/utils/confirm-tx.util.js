import currencyFormatter from 'currency-formatter';
import currencies from 'currency-formatter/currencies';
import BigNumber from 'bignumber.js';

import { unconfirmedTransactionsCountSelector } from '../../selectors';
import { Numeric } from '../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../shared/constants/common';

export function getHexGasTotal({ gasLimit = '0x0', gasPrice = '0x0' }) {
  return new Numeric(gasLimit, 16)
    .times(new Numeric(gasPrice, 16))
    .toPrefixedHexString();
}

export function addEth(firstValue, ...otherValues) {
  return otherValues
    .reduce((numericAcc, ethAmount) => {
      return numericAcc.add(new Numeric(ethAmount, 10)).round(6);
    }, new Numeric(firstValue, 10))
    .toString();
}

export function addFiat(firstValue, ...otherValues) {
  return otherValues
    .reduce((numericAcc, fiatAmount) => {
      return numericAcc.add(new Numeric(fiatAmount, 10)).round(2);
    }, new Numeric(firstValue, 10))
    .toString();
}

export function getTransactionFee({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  numberOfDecimals,
}) {
  let fee = new Numeric(value, 16, EtherDenomination.WEI)
    .toDenomination(EtherDenomination.ETH)
    .toBase(10);

  if (fromCurrency !== toCurrency && conversionRate) {
    fee = fee.applyConversionRate(conversionRate);
  }
  return fee.round(numberOfDecimals).toString();
}

export function formatCurrency(value, currencyCode) {
  const upperCaseCurrencyCode = currencyCode.toUpperCase();

  return currencies.find((currency) => currency.code === upperCaseCurrencyCode)
    ? currencyFormatter.format(Number(value), {
        code: upperCaseCurrencyCode,
        style: 'currency',
      })
    : value;
}

export function convertTokenToFiat({
  value,
  fromCurrency = 'ETH',
  toCurrency,
  conversionRate,
  contractExchangeRate,
}) {
  const totalExchangeRate = conversionRate * contractExchangeRate;

  let tokenInFiat = new Numeric(value, 10);

  if (fromCurrency !== toCurrency && totalExchangeRate) {
    tokenInFiat = tokenInFiat.applyConversionRate(totalExchangeRate);
  }

  return tokenInFiat.round(2).toString();
}

export function hasUnconfirmedTransactions(state) {
  return unconfirmedTransactionsCountSelector(state) > 0;
}

/**
 * Rounds the given decimal string to 4 significant digits.
 *
 * @param {string} decimalString - The base-ten number to round.
 * @returns {string} The rounded number, or the original number if no
 * rounding was necessary.
 */
export function roundExponential(decimalString) {
  const PRECISION = 4;
  const bigNumberValue = new BigNumber(decimalString);

  // In JS, numbers with exponentials greater than 20 get displayed as an exponential.
  return bigNumberValue.e > 20
    ? bigNumberValue.toPrecision(PRECISION)
    : decimalString;
}

export function areDappSuggestedAndTxParamGasFeesTheSame(txData = {}) {
  const { txParams, dappSuggestedGasFees } = txData;
  const {
    gasPrice: txParamsGasPrice,
    maxFeePerGas: txParamsMaxFeePerGas,
    maxPriorityFeePerGas: txParamsMaxPriorityFeePerGas,
  } = txParams || {};
  const {
    gasPrice: dappGasPrice,
    maxFeePerGas: dappMaxFeePerGas,
    maxPriorityFeePerGas: dappMaxPriorityFeePerGas,
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

  return (
    txParamsGasPriceMatchesDappSuggestedGasPrice ||
    txParamsEIP1559FeesMatchDappSuggestedGasPrice ||
    txParamsEIP1559FeesMatchDappSuggestedEIP1559Fees
  );
}
