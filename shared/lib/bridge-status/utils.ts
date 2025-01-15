import { TransactionMeta } from '@metamask/transaction-controller';
import { QuoteResponse } from '../../types/bridge';
import {
  QuoteMetadataSerialized,
  StatusRequest,
  StatusTypes,
} from '../../types/bridge-status';

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
