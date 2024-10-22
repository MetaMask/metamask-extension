import { zeroAddress } from 'ethereumjs-util';
import { BigNumber } from 'bignumber.js';
import { getAddress } from 'ethers/lib/utils';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { Quote, QuoteResponse } from '../types';

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
    fromTokenExchangeRates[getAddress(srcAsset.address)] ??
    fromTokenExchangeRates[srcAsset.address.toLowerCase()];
  return {
    raw: normalizedSentAmount,
    fiat:
      fromTokenExchangeRate && fromNativeExchangeRate
        ? normalizedSentAmount
            .mul(fromTokenExchangeRate.toString())
            .mul(fromNativeExchangeRate.toString())
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

// TODO include reset approval gas
// TODO reuse in action
const calcTotalGasFee = (
  bridgeQuote: QuoteResponse,
  maxFeePerGas: string,
  maxPriorityFeePerGas: string,
  fromNativeExchangeRate?: number,
) => {
  const { approval, trade } = bridgeQuote;
  const totalGasLimit = calcTokenAmount(
    new BigNumber(trade.gasLimit ?? 0).plus(approval?.gasLimit ?? 0),
    18,
  );
  // TODO L1 gas?
  const l1GasInGwei = new BigNumber(0);
  const feePerGasInGwei = new BigNumber(maxFeePerGas).add(maxPriorityFeePerGas);
  const gasFeesInGwei = feePerGasInGwei.times(totalGasLimit).plus(l1GasInGwei);
  const gasFeesInEth = new BigNumber(gasFeesInGwei);
  const gasFeesInUSD = fromNativeExchangeRate
    ? gasFeesInEth.times(fromNativeExchangeRate)
    : null;

  // TODO follow gas calculation in https://github.com/MetaMask/metamask-extension/pull/27612
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

export const formatEtaInMinutes = (estimatedProcessingTimeInSeconds: number) =>
  (estimatedProcessingTimeInSeconds / 60).toFixed();
