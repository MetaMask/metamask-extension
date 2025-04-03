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
 * Bridge transaction interface defining the expected shape of transactions
 * processed by the bridge status utilities
 */
type BridgeTransaction = {
  isBridgeTx: boolean;
  bridgeInfo?: {
    status?: string;
  };
};

/**
 * Determines if a bridge transaction is complete based on its status
 *
 * @param transaction - The transaction object to check
 * @returns Whether the transaction is complete
 */
export function isBridgeComplete(transaction: BridgeTransaction): boolean {
  return Boolean(
    transaction.isBridgeTx &&
      transaction.bridgeInfo &&
      (transaction.bridgeInfo.status === StatusTypes.COMPLETE ||
        transaction.bridgeInfo.status === 'COMPLETE'),
  );
}

/**
 * Determines if a bridge transaction has failed by checking its status
 * or comparing it with the provided status key
 *
 * @param transaction - The transaction object to check
 * @param statusKey - The calculated status key from transaction controller
 * @returns Whether the transaction is failed
 */
export function isBridgeFailed(
  transaction: BridgeTransaction,
  statusKey: string,
): boolean {
  return Boolean(
    transaction.isBridgeTx &&
      transaction.bridgeInfo &&
      (transaction.bridgeInfo.status === StatusTypes.FAILED ||
        transaction.bridgeInfo.status === 'FAILED' ||
        statusKey === TransactionStatus.failed),
  );
}

/**
 * Determines the appropriate status key for a bridge transaction
 * by examining its status and returning the corresponding transaction status
 *
 * @param transaction - The transaction object
 * @param defaultStatusKey - The default status key from regular transaction handling
 * @returns The appropriate status key
 */
export function getBridgeStatusKey(
  transaction: BridgeTransaction,
  defaultStatusKey: string,
): string {
  if (transaction.isBridgeTx && transaction.bridgeInfo) {
    if (
      transaction.bridgeInfo.status === StatusTypes.COMPLETE ||
      transaction.bridgeInfo.status === 'COMPLETE'
    ) {
      return TransactionStatus.confirmed;
    } else if (
      transaction.bridgeInfo.status === StatusTypes.FAILED ||
      transaction.bridgeInfo.status === 'FAILED'
    ) {
      return TransactionStatus.failed;
    }
  }

  return defaultStatusKey;
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
