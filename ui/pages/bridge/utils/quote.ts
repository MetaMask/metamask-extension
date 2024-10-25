import { zeroAddress } from 'ethereumjs-util';
import { BigNumber } from 'bignumber.js';
import { getAddress } from 'ethers/lib/utils';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { QuoteResponse, QuoteRequest, Quote } from '../types';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';

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
    )
  );
};

export const calcToAmount = (
  { destTokenAmount, destAsset }: Quote,
  toTokenExchangeRate: number | null,
  toNativeExchangeRate: number | null,
) => {
  const normalizedDestAmount = calcTokenAmount(
    destTokenAmount,
    destAsset.decimals,
  );
  return {
    raw: normalizedDestAmount,
    fiat:
      toTokenExchangeRate && toNativeExchangeRate
        ? normalizedDestAmount.mul(
            destAsset.address === zeroAddress()
              ? toNativeExchangeRate.toString()
              : toTokenExchangeRate.toString(),
          )
        : null,
  };
};

export const calcSentAmount = (
  { srcTokenAmount, srcAsset, feeData }: Quote,
  fromTokenExchangeRates: Record<string, number | null>,
  fromNativeExchangeRate: number | null,
) => {
  const normalizedSentAmount = calcTokenAmount(
    new BigNumber(srcTokenAmount).plus(feeData.metabridge.amount),
    srcAsset.decimals,
  );
  const fromTokenExchangeRate =
    srcAsset.address === zeroAddress()
      ? fromNativeExchangeRate
      : fromTokenExchangeRates[getAddress(srcAsset.address)] ??
        fromTokenExchangeRates[srcAsset.address.toLowerCase()];
  return {
    raw: normalizedSentAmount,
    fiat: fromTokenExchangeRate
      ? normalizedSentAmount.mul(fromTokenExchangeRate.toString())
      : null,
  };
};

const calcRelayerFee = (
  bridgeQuote: QuoteResponse,
  fromNativeExchangeRate?: number,
) => {
  const {
    quote: { srcAsset, srcTokenAmount, feeData },
    trade,
  } = bridgeQuote;
  const relayerFeeInNative = calcTokenAmount(
    new BigNumber(trade.value).minus(
      srcAsset.address === zeroAddress()
        ? new BigNumber(srcTokenAmount).plus(feeData.metabridge.amount)
        : 0,
    ),
    18,
  );
  return {
    raw: relayerFeeInNative,
    fiat: fromNativeExchangeRate
      ? relayerFeeInNative.mul(fromNativeExchangeRate)
      : null,
  };
};

const calcTotalGasFee = (
  bridgeQuote: QuoteResponse,
  maxFeePerGas: string,
  maxPriorityFeePerGas: string,
  fromNativeExchangeRate?: number,
  l1GasInGwei?: BigNumber,
) => {
  const { approval, trade } = bridgeQuote;
  const totalGasLimit = calcTokenAmount(
    new BigNumber(trade.gasLimit ?? 0).plus(approval?.gasLimit ?? 0),
    18,
  );
  const feePerGasInGwei = new BigNumber(maxFeePerGas).add(maxPriorityFeePerGas);
  const gasFeesInGwei = feePerGasInGwei
    .times(totalGasLimit)
    .plus(l1GasInGwei ?? 0);
  const gasFeesInEth = new BigNumber(gasFeesInGwei);
  const gasFeesInUSD = fromNativeExchangeRate
    ? gasFeesInEth.times(fromNativeExchangeRate)
    : null;

  return {
    raw: gasFeesInEth,
    fiat: gasFeesInUSD,
  };
};

export const calcTotalNetworkFee = (
  bridgeQuote: QuoteResponse,
  maxFeePerGas: string,
  maxPriorityFeePerGas: string,
  fromNativeExchangeRate?: number,
) => {
  const normalizedGasFee = calcTotalGasFee(
    bridgeQuote,
    maxFeePerGas,
    maxPriorityFeePerGas,
    fromNativeExchangeRate,
  );
  const normalizedRelayerFee = calcRelayerFee(
    bridgeQuote,
    fromNativeExchangeRate,
  );
  return {
    raw: normalizedGasFee.raw.plus(normalizedRelayerFee.raw),
    fiat: normalizedGasFee.fiat?.plus(normalizedRelayerFee.fiat || '0') ?? null,
  };
};

export const calcAdjustedReturn = (
  destTokenAmountInFiat: BigNumber | null,
  totalNetworkFeeInFiat: BigNumber | null,
) => ({
  fiat:
    destTokenAmountInFiat && totalNetworkFeeInFiat
      ? destTokenAmountInFiat.minus(totalNetworkFeeInFiat)
      : null,
});

export const calcSwapRate = (
  sentAmount: BigNumber,
  destTokenAmount: BigNumber,
) => destTokenAmount.div(sentAmount);

export const calcCost = (
  adjustedReturnInFiat: BigNumber | null,
  sentAmountInFiat: BigNumber | null,
) => ({
  fiat:
    adjustedReturnInFiat && sentAmountInFiat
      ? adjustedReturnInFiat.minus(sentAmountInFiat)
      : null,
});

export const formatEtaInMinutes = (estimatedProcessingTimeInSeconds: number) =>
  (estimatedProcessingTimeInSeconds / 60).toFixed();

export const formatTokenAmount = (
  amount: BigNumber,
  symbol: string,
  precision: number = 2,
) => `${amount.toFixed(precision)} ${symbol}`;

export const formatFiatAmount = (amount: BigNumber | null, currency: string) =>
  amount ? formatCurrency(amount.toString(), currency) : undefined;
