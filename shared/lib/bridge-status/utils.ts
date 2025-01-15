import { TransactionMeta } from '@metamask/transaction-controller';
import { QuoteMetadata, QuoteResponse } from '../../types/bridge';
import {
  QuoteMetadataSerialized,
  StatusRequest,
  StatusTypes,
} from '../../types/bridge-status';

export const serializeQuoteMetadata = (
  quoteResponse: QuoteResponse & QuoteMetadata,
): QuoteResponse & QuoteMetadataSerialized => {
  return {
    ...quoteResponse,
    sentAmount: {
      amount: quoteResponse.sentAmount.amount.toString(),
      valueInCurrency: quoteResponse.sentAmount.valueInCurrency
        ? quoteResponse.sentAmount.valueInCurrency.toString()
        : null,
      usd: quoteResponse.sentAmount.usd
        ? quoteResponse.sentAmount.usd.toString()
        : null,
    },
    gasFee: {
      amount: quoteResponse.gasFee.amount.toString(),
      valueInCurrency: quoteResponse.gasFee.valueInCurrency
        ? quoteResponse.gasFee.valueInCurrency.toString()
        : null,
      usd: quoteResponse.gasFee.usd
        ? quoteResponse.gasFee.usd.toString()
        : null,
    },
    totalNetworkFee: {
      amount: quoteResponse.totalNetworkFee.amount.toString(),
      valueInCurrency: quoteResponse.totalNetworkFee.valueInCurrency
        ? quoteResponse.totalNetworkFee.valueInCurrency.toString()
        : null,
      usd: quoteResponse.totalNetworkFee.usd
        ? quoteResponse.totalNetworkFee.usd.toString()
        : null,
    },
    totalMaxNetworkFee: {
      amount: quoteResponse.totalMaxNetworkFee.amount.toString(),
      valueInCurrency: quoteResponse.totalMaxNetworkFee.valueInCurrency
        ? quoteResponse.totalMaxNetworkFee.valueInCurrency.toString()
        : null,
      usd: quoteResponse.totalMaxNetworkFee.usd
        ? quoteResponse.totalMaxNetworkFee.usd.toString()
        : null,
    },
    toTokenAmount: {
      amount: quoteResponse.toTokenAmount.amount.toString(),
      valueInCurrency: quoteResponse.toTokenAmount.valueInCurrency
        ? quoteResponse.toTokenAmount.valueInCurrency.toString()
        : null,
      usd: quoteResponse.toTokenAmount.usd
        ? quoteResponse.toTokenAmount.usd.toString()
        : null,
    },
    adjustedReturn: {
      valueInCurrency: quoteResponse.adjustedReturn.valueInCurrency
        ? quoteResponse.adjustedReturn.valueInCurrency.toString()
        : null,
      usd: quoteResponse.adjustedReturn.usd
        ? quoteResponse.adjustedReturn.usd.toString()
        : null,
    },
    swapRate: quoteResponse.swapRate.toString(),
    cost: {
      valueInCurrency: quoteResponse.cost.valueInCurrency
        ? quoteResponse.cost.valueInCurrency.toString()
        : null,
      usd: quoteResponse.cost.usd ? quoteResponse.cost.usd.toString() : null,
    },
  };
};

export const getInitialHistoryItem = ({
  quoteResponse,
  bridgeTxMetaId,
  startTime,
  slippagePercentage,
  initialDestAssetBalance,
  targetContractAddress,
  account,
  statusRequest,
}: {
  quoteResponse: QuoteResponse & QuoteMetadataSerialized;
  bridgeTxMetaId: string;
  startTime: number | undefined;
  slippagePercentage: number;
  initialDestAssetBalance: string | undefined;
  targetContractAddress: string | undefined;
  account: string;
  statusRequest: StatusRequest;
}) => {
  return {
    txMetaId: bridgeTxMetaId,
    quote: quoteResponse.quote,
    startTime,
    estimatedProcessingTimeInSeconds:
      quoteResponse.estimatedProcessingTimeInSeconds,
    slippagePercentage,
    pricingData: {
      amountSent: quoteResponse.sentAmount.amount,
      amountSentInUsd: quoteResponse.sentAmount.usd ?? undefined,
      quotedGasInUsd: quoteResponse.gasFee.usd ?? undefined,
      quotedReturnInUsd: quoteResponse.toTokenAmount.usd ?? undefined,
    },
    initialDestAssetBalance,
    targetContractAddress,
    account,
    status: {
      // We always have a PENDING status when we start polling for a tx, don't need the Bridge API for that
      // Also we know the bare minimum fields for status at this point in time
      status: StatusTypes.PENDING,
      srcChain: {
        chainId: statusRequest.srcChainId,
        txHash: statusRequest.srcTxHash,
      },
    },
    hasApprovalTx: Boolean(quoteResponse.approval),
  };
};
