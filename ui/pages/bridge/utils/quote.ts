import { zeroAddress } from 'ethereumjs-util';
import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { QuoteResponse, QuoteRequest, Quote, L1GasFees } from '../types';
import {
  hexToDecimal,
  sumDecimals,
} from '../../../../shared/modules/conversion.utils';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { DEFAULT_PRECISION } from '../../../hooks/useCurrencyDisplay';

export const isNativeAddress = (address?: string) => address === zeroAddress();

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

export const calcTotalGasFee = (
  bridgeQuote: QuoteResponse & L1GasFees,
  estimatedBaseFeeInDecGwei: string,
  maxPriorityFeePerGasInDecGwei: string,
  nativeExchangeRate?: number,
) => {
  const { approval, trade, l1GasFeesInHexWei } = bridgeQuote;
  const totalGasLimitInDec = sumDecimals(
    trade.gasLimit?.toString() ?? '0',
    approval?.gasLimit?.toString() ?? '0',
  );
  const feePerGasInDecGwei = sumDecimals(
    estimatedBaseFeeInDecGwei,
    maxPriorityFeePerGasInDecGwei,
  );

  const l1GasFeesInDecGWei = Numeric.from(
    l1GasFeesInHexWei ?? '0',
    16,
    EtherDenomination.WEI,
  ).toDenomination(EtherDenomination.GWEI);

  const gasFeesInDecGwei = totalGasLimitInDec
    .times(feePerGasInDecGwei)
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

export const formatEtaInMinutes = (estimatedProcessingTimeInSeconds: number) =>
  (estimatedProcessingTimeInSeconds / 60).toFixed();

export const formatTokenAmount = (
  amount: BigNumber,
  symbol: string,
  precision: number = 2,
) => `${amount.toFixed(precision)} ${symbol}`;

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
      return `<${formatCurrency('0', currency, precision)}`;
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
