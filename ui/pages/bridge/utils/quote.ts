import { zeroAddress } from 'ethereumjs-util';
import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import type {
  QuoteResponse,
  Quote,
  L1GasFees,
} from '../../../../shared/types/bridge';
import {
  hexToDecimal,
  sumDecimals,
} from '../../../../shared/modules/conversion.utils';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { DEFAULT_PRECISION } from '../../../hooks/useCurrencyDisplay';
import { formatAmount } from '../../confirmations/components/simulation-details/formatAmount';

export const isQuoteExpired = (
  isQuoteGoingToRefresh: boolean,
  refreshRate: number,
  quotesLastFetchedMs?: number,
) =>
  Boolean(
    !isQuoteGoingToRefresh &&
      quotesLastFetchedMs &&
      Date.now() - quotesLastFetchedMs > refreshRate,
  );

export const isNativeAddress = (address?: string | null) =>
  address === zeroAddress() || address === '' || !address;

export const calcToAmount = (
  { destTokenAmount, destAsset }: Quote,
  exchangeRate: number | null,
) => {
  const normalizedDestAmount = calcTokenAmount(
    destTokenAmount,
    destAsset.decimals,
  );
  return {
    amount: normalizedDestAmount,
    valueInCurrency: exchangeRate
      ? normalizedDestAmount.mul(exchangeRate.toString())
      : null,
  };
};

export const calcSentAmount = (
  { srcTokenAmount, srcAsset, feeData }: Quote,
  exchangeRate: number | null,
) => {
  const normalizedSentAmount = calcTokenAmount(
    new BigNumber(srcTokenAmount).plus(feeData.metabridge.amount),
    srcAsset.decimals,
  );
  return {
    amount: normalizedSentAmount,
    valueInCurrency: exchangeRate
      ? normalizedSentAmount.mul(exchangeRate.toString())
      : null,
  };
};

export const calcRelayerFee = (
  bridgeQuote: QuoteResponse,
  nativeExchangeRate?: number,
) => {
  const {
    quote: { srcAsset, srcTokenAmount, feeData },
    trade,
  } = bridgeQuote;
  const relayerFeeInNative = calcTokenAmount(
    new BigNumber(hexToDecimal(trade.value)).minus(
      isNativeAddress(srcAsset.address)
        ? new BigNumber(srcTokenAmount).plus(feeData.metabridge.amount)
        : 0,
    ),
    18,
  );
  return {
    amount: relayerFeeInNative,
    valueInCurrency: nativeExchangeRate
      ? relayerFeeInNative.mul(nativeExchangeRate.toString())
      : null,
  };
};

const calcTotalGasFee = ({
  bridgeQuote,
  feePerGasInDecGwei,
  priorityFeePerGasInDecGwei,
  nativeExchangeRate,
}: {
  bridgeQuote: QuoteResponse & L1GasFees;
  feePerGasInDecGwei: string;
  priorityFeePerGasInDecGwei: string;
  nativeExchangeRate?: number;
}) => {
  const { approval, trade, l1GasFeesInHexWei } = bridgeQuote;

  const totalGasLimitInDec = sumDecimals(
    trade.gasLimit?.toString() ?? '0',
    approval?.gasLimit?.toString() ?? '0',
  );
  const totalFeePerGasInDecGwei = sumDecimals(
    feePerGasInDecGwei,
    priorityFeePerGasInDecGwei,
  );
  const l1GasFeesInDecGWei = Numeric.from(
    l1GasFeesInHexWei ?? '0',
    16,
    EtherDenomination.WEI,
  ).toDenomination(EtherDenomination.GWEI);
  const gasFeesInDecGwei = totalGasLimitInDec
    .times(totalFeePerGasInDecGwei)
    .add(l1GasFeesInDecGWei);
  const gasFeesInDecEth = new BigNumber(
    gasFeesInDecGwei.shiftedBy(9).toString(),
  );
  const gasFeesInUSD = nativeExchangeRate
    ? gasFeesInDecEth.times(nativeExchangeRate.toString())
    : null;

  return {
    amount: gasFeesInDecEth,
    valueInCurrency: gasFeesInUSD,
  };
};

export const calcEstimatedAndMaxTotalGasFee = ({
  bridgeQuote,
  estimatedBaseFeeInDecGwei,
  maxFeePerGasInDecGwei,
  maxPriorityFeePerGasInDecGwei,
  nativeExchangeRate,
}: {
  bridgeQuote: QuoteResponse & L1GasFees;
  estimatedBaseFeeInDecGwei: string;
  maxFeePerGasInDecGwei: string;
  maxPriorityFeePerGasInDecGwei: string;
  nativeExchangeRate?: number;
}) => {
  const { amount, valueInCurrency } = calcTotalGasFee({
    bridgeQuote,
    feePerGasInDecGwei: estimatedBaseFeeInDecGwei,
    priorityFeePerGasInDecGwei: maxPriorityFeePerGasInDecGwei,
    nativeExchangeRate,
  });
  const { amount: amountMax, valueInCurrency: valueInCurrencyMax } =
    calcTotalGasFee({
      bridgeQuote,
      feePerGasInDecGwei: maxFeePerGasInDecGwei,
      priorityFeePerGasInDecGwei: maxPriorityFeePerGasInDecGwei,
      nativeExchangeRate,
    });
  return {
    amount,
    amountMax,
    valueInCurrency,
    valueInCurrencyMax,
  };
};

export const calcAdjustedReturn = (
  destTokenAmountInCurrency: BigNumber | null,
  totalNetworkFeeInCurrency: BigNumber | null,
) => ({
  valueInCurrency:
    destTokenAmountInCurrency && totalNetworkFeeInCurrency
      ? destTokenAmountInCurrency.minus(totalNetworkFeeInCurrency)
      : null,
});

export const calcSwapRate = (
  sentAmount: BigNumber,
  destTokenAmount: BigNumber,
) => destTokenAmount.div(sentAmount);

export const calcCost = (
  adjustedReturnInCurrency: BigNumber | null,
  sentAmountInCurrency: BigNumber | null,
) => ({
  valueInCurrency:
    adjustedReturnInCurrency && sentAmountInCurrency
      ? sentAmountInCurrency.minus(adjustedReturnInCurrency)
      : null,
});

export const formatEtaInMinutes = (
  estimatedProcessingTimeInSeconds: number,
) => {
  if (estimatedProcessingTimeInSeconds < 60) {
    return `< 1`;
  }
  return (estimatedProcessingTimeInSeconds / 60).toFixed();
};

export const formatTokenAmount = (
  locale: string,
  amount: BigNumber,
  symbol: string = '',
) => {
  const stringifiedAmount = formatAmount(locale, amount);

  return [stringifiedAmount, symbol].join(' ').trim();
};

export const formatCurrencyAmount = (
  amount: BigNumber | null,
  currency: string,
  precision: number = DEFAULT_PRECISION,
) => {
  if (!amount) {
    return undefined;
  }
  if (precision === 0) {
    if (amount.lt(0.01)) {
      return '<$0.01';
    }
    if (amount.lt(1)) {
      return formatCurrency(amount.toString(), currency, 2);
    }
  }
  return formatCurrency(amount.toString(), currency, precision);
};

export const formatProviderLabel = (
  quote?: QuoteResponse,
): `${string}_${string}` =>
  `${quote?.quote.bridgeId}_${quote?.quote.bridges[0]}`;
