import BigNumber from 'bignumber.js';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { Quote, QuoteResponse } from '../types';
import { zeroAddress } from 'ethereumjs-util';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';

export interface BridgeQuoteAmount {
  raw: BigNumber;
  fiat: BigNumber | null;
}

// TODO include reset approval gas
export const getTotalGasFee = (
  bridgeQuote: QuoteResponse,
  fromNativeExchangeRate?: number,
) => {
  const { approval, trade } = bridgeQuote;

  const totalGasLimit = calcTokenAmount(
    new BigNumber(trade.gasLimit ?? 0).plus(approval?.gasLimit ?? 0),
    18,
  );

  // TODO follow gas calculation in https://github.com/MetaMask/metamask-extension/pull/27612
  return {
    raw: totalGasLimit,
    fiat: fromNativeExchangeRate
      ? totalGasLimit.mul(fromNativeExchangeRate)
      : null,
  };
};

export const getRelayerFee = (
  bridgeQuote: QuoteResponse,
  fromNativeExchangeRate?: string,
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

export const getQuoteDisplayData = (
  ticker: string,
  currency: string,
  quoteResponse?: QuoteResponse,
  gasFees?: BridgeQuoteAmount,
  relayerFees?: BridgeQuoteAmount,
) => {
  const { quote, estimatedProcessingTimeInSeconds } = quoteResponse ?? {};
  if (!quoteResponse || !quote || !estimatedProcessingTimeInSeconds) return {};

  const etaInMinutes = (estimatedProcessingTimeInSeconds / 60).toFixed();

  return {
    etaInMinutes,
    totalFees: {
      amount: `${gasFees?.raw.plus(relayerFees?.raw ?? 0)} ${ticker}`,
      fiat: formatCurrency(
        (gasFees?.fiat?.plus(relayerFees?.fiat ?? 0) ?? 0).toString(),
        currency,
      ),
    },
  };
};
