import { zeroAddress } from 'ethereumjs-util';
import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import {
  QuoteResponse,
  QuoteRequest,
  Quote,
  L1GasFees,
  TokenAmountValues,
} from '../types';
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

export const isValidQuoteRequest = (
  partialRequest: Partial<QuoteRequest>,
  requireAmount = true,
): partialRequest is QuoteRequest => {
  const STRING_FIELDS = ['srcTokenAddress', 'destTokenAddress'];
  if (requireAmount) {
    STRING_FIELDS.push('srcTokenAmount');
  }
  const NUMBER_FIELDS = ['srcChainId', 'destChainId', 'slippage'];

  return (
    STRING_FIELDS.every(
      (field) =>
        field in partialRequest &&
        typeof partialRequest[field as keyof typeof partialRequest] ===
          'string' &&
        partialRequest[field as keyof typeof partialRequest] !== undefined &&
        partialRequest[field as keyof typeof partialRequest] !== '' &&
        partialRequest[field as keyof typeof partialRequest] !== null,
    ) &&
    NUMBER_FIELDS.every(
      (field) =>
        field in partialRequest &&
        typeof partialRequest[field as keyof typeof partialRequest] ===
          'number' &&
        partialRequest[field as keyof typeof partialRequest] !== undefined &&
        !isNaN(Number(partialRequest[field as keyof typeof partialRequest])) &&
        partialRequest[field as keyof typeof partialRequest] !== null,
    ) &&
    (requireAmount
      ? Boolean((partialRequest.srcTokenAmount ?? '').match(/^[1-9]\d*$/u))
      : true)
  );
};

export const calcToAmount = (
  { destTokenAmount, destAsset }: Quote,
  exchangeRate: number | null,
  usdExchangeRate: number | null,
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
    usd: usdExchangeRate
      ? normalizedDestAmount.mul(usdExchangeRate.toString())
      : null,
  };
};

export const calcSentAmount = (
  { srcTokenAmount, srcAsset, feeData }: Quote,
  exchangeRate: number | null,
  usdExchangeRate: number | null,
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
    usd: usdExchangeRate
      ? normalizedSentAmount.mul(usdExchangeRate.toString())
      : null,
  };
};

export const calcRelayerFee = (
  bridgeQuote: QuoteResponse,
  nativeToDisplayCurrencyExchangeRate?: number,
  nativeToUsdExchangeRate?: number,
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
    valueInCurrency: nativeToDisplayCurrencyExchangeRate
      ? relayerFeeInNative.mul(nativeToDisplayCurrencyExchangeRate.toString())
      : null,
    usd: nativeToUsdExchangeRate
      ? relayerFeeInNative.mul(nativeToUsdExchangeRate.toString())
      : null,
  };
};

const calcTotalGasFee = ({
  bridgeQuote,
  feePerGasInDecGwei,
  priorityFeePerGasInDecGwei,
  nativeToDisplayCurrencyExchangeRate,
  nativeToUsdExchangeRate,
}: {
  bridgeQuote: QuoteResponse & L1GasFees;
  feePerGasInDecGwei: string;
  priorityFeePerGasInDecGwei: string;
  nativeToDisplayCurrencyExchangeRate?: number;
  nativeToUsdExchangeRate?: number;
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

  const gasFeesInDisplayCurrency = nativeToDisplayCurrencyExchangeRate
    ? gasFeesInDecEth.times(nativeToDisplayCurrencyExchangeRate.toString())
    : null;
  const gasFeesInUSD = nativeToUsdExchangeRate
    ? gasFeesInDecEth.times(nativeToUsdExchangeRate.toString())
    : null;

  return {
    amount: gasFeesInDecEth,
    valueInCurrency: gasFeesInDisplayCurrency,
    usd: gasFeesInUSD,
  };
};

export const calcEstimatedAndMaxTotalGasFee = ({
  bridgeQuote,
  estimatedBaseFeeInDecGwei,
  maxFeePerGasInDecGwei,
  maxPriorityFeePerGasInDecGwei,
  nativeToDisplayCurrencyExchangeRate,
  nativeToUsdExchangeRate,
}: {
  bridgeQuote: QuoteResponse & L1GasFees;
  estimatedBaseFeeInDecGwei: string;
  maxFeePerGasInDecGwei: string;
  maxPriorityFeePerGasInDecGwei: string;
  nativeToDisplayCurrencyExchangeRate?: number;
  nativeToUsdExchangeRate?: number;
}) => {
  const { amount, valueInCurrency, usd } = calcTotalGasFee({
    bridgeQuote,
    feePerGasInDecGwei: estimatedBaseFeeInDecGwei,
    priorityFeePerGasInDecGwei: maxPriorityFeePerGasInDecGwei,
    nativeToDisplayCurrencyExchangeRate,
    nativeToUsdExchangeRate,
  });
  const {
    amount: amountMax,
    valueInCurrency: valueInCurrencyMax,
    usd: usdMax,
  } = calcTotalGasFee({
    bridgeQuote,
    feePerGasInDecGwei: maxFeePerGasInDecGwei,
    priorityFeePerGasInDecGwei: maxPriorityFeePerGasInDecGwei,
    nativeToDisplayCurrencyExchangeRate,
    nativeToUsdExchangeRate,
  });
  return {
    amount,
    amountMax,
    valueInCurrency,
    valueInCurrencyMax,
    usd,
    usdMax,
  };
};

export const calcAdjustedReturn = (
  toTokenAmount: TokenAmountValues,
  totalEstimatedNetworkFee: TokenAmountValues,
) => ({
  valueInCurrency:
    toTokenAmount.valueInCurrency && totalEstimatedNetworkFee.valueInCurrency
      ? toTokenAmount.valueInCurrency.minus(
          totalEstimatedNetworkFee.valueInCurrency,
        )
      : null,
  usd:
    toTokenAmount.usd && totalEstimatedNetworkFee.usd
      ? toTokenAmount.usd.minus(totalEstimatedNetworkFee.usd)
      : null,
});

export const calcSwapRate = (
  sentAmount: BigNumber,
  destTokenAmount: BigNumber,
) => destTokenAmount.div(sentAmount);

export const calcCost = (
  adjustedReturn: Omit<TokenAmountValues, 'amount'>,
  sentAmount: Omit<TokenAmountValues, 'amount'>,
) => ({
  valueInCurrency:
    adjustedReturn.valueInCurrency && sentAmount.valueInCurrency
      ? sentAmount.valueInCurrency.minus(adjustedReturn.valueInCurrency)
      : null,
  usd:
    adjustedReturn.usd && sentAmount.usd
      ? sentAmount.usd.minus(adjustedReturn.usd)
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

export const formatProviderLabel = (args?: {
  bridgeId: QuoteResponse['quote']['bridgeId'];
  bridges: QuoteResponse['quote']['bridges'];
}): `${string}_${string}` => `${args?.bridgeId}_${args?.bridges[0]}`;
