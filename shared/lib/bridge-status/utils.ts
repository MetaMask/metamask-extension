import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
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

/**
 * Internal type defining the relevant parts of a transaction object
 * needed for bridge status utility functions.
 */
type BridgeTransaction = {
  isBridgeTx: boolean;
  bridgeInfo?: {
    status?: string;
    destTxHash?: string;
  };
};

export function isBridgeComplete(transaction: BridgeTransaction): boolean {
  return Boolean(
    transaction.isBridgeTx &&
      transaction.bridgeInfo &&
      (transaction.bridgeInfo.status === StatusTypes.COMPLETE ||
        transaction.bridgeInfo.status === 'COMPLETE') &&
      typeof transaction.bridgeInfo.destTxHash === 'string' &&
      transaction.bridgeInfo.destTxHash.length > 0,
  );
}

export function isBridgeFailed(
  transaction: BridgeTransaction,
  baseStatusKey: string,
): boolean {
  const bridgeFailed = Boolean(
    transaction.isBridgeTx &&
      transaction.bridgeInfo &&
      (transaction.bridgeInfo.status === StatusTypes.FAILED ||
        transaction.bridgeInfo.status === 'FAILED'),
  );
  const baseFailed = baseStatusKey === TransactionStatus.failed;

  return bridgeFailed || baseFailed;
}

export function getBridgeStatusKey(
  transaction: BridgeTransaction,
  baseStatusKey: string,
): string {
  if (!transaction.isBridgeTx || !transaction.bridgeInfo) {
    return baseStatusKey;
  }

  if (isBridgeFailed(transaction, baseStatusKey)) {
    return TransactionStatus.failed;
  }

  if (
    isBridgeComplete(transaction) &&
    baseStatusKey === TransactionStatus.confirmed
  ) {
    return TransactionStatus.confirmed;
  }

  return TransactionStatus.submitted;
}

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
      status: StatusTypes.PENDING,
      srcChain: {
        chainId: statusRequest.srcChainId,
        txHash: statusRequest.srcTxHash,
      },
    },
    hasApprovalTx: Boolean(quoteResponse.approval),
  };
};
