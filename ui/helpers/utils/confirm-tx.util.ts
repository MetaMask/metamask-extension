import currencyFormatter from 'currency-formatter';
import currencies from 'currency-formatter/currencies';

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
