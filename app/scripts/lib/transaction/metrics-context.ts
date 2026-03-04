import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  TokenStandard,
  TransactionApprovalAmountType,
} from '../../../../shared/constants/transaction';
import { determineTransactionAssetType } from '../../../../shared/modules/transaction.utils';
import type { TransactionMetricsRequest } from '../../../../shared/types/metametrics';
import type { TransactionMetricsBuilderRequest } from './metrics-builders/types';

export const CONTRACT_INTERACTION_TYPES = [
  TransactionType.bridge,
  TransactionType.bridgeApproval,
  TransactionType.contractInteraction,
  TransactionType.tokenMethodApprove,
  TransactionType.tokenMethodIncreaseAllowance,
  TransactionType.tokenMethodSafeTransferFrom,
  TransactionType.tokenMethodSetApprovalForAll,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.swap,
  TransactionType.swapAndSend,
  TransactionType.swapApproval,
];

/**
 * Builds the shared transaction metrics context consumed by all metric builders.
 *
 * This centralizes one-time derivations from transaction data and controller
 * lookups (type classification, contract interaction flags, method metadata,
 * asset/token metadata, and approval amount classification) so individual
 * builders can remain focused on emitting event properties.
 *
 * @param args - Context construction dependencies.
 * @param args.transactionMeta - Transaction metadata for the current event.
 * @param args.transactionMetricsRequest - Request adapter used for external lookups.
 * @returns Normalized context object reused across all metrics builders.
 */
export async function buildTransactionMetricsContext({
  transactionMeta,
  transactionMetricsRequest,
}: {
  transactionMeta: TransactionMeta;
  transactionMetricsRequest: TransactionMetricsRequest;
}): Promise<TransactionMetricsBuilderRequest['context']> {
  const { transactionType, isContractInteraction } =
    determineTransactionTypeAndContractInteraction(
      transactionMeta.type ?? '',
      transactionMeta.originalType,
    );

  let contractMethodName;
  if (transactionMeta.txParams.data) {
    const methodData = await transactionMetricsRequest.getMethodData(
      transactionMeta.txParams.data,
    );
    contractMethodName = methodData?.name;
  }

  const { assetType, tokenStandard } = await determineTransactionAssetType(
    transactionMeta,
    transactionMetricsRequest.provider,
    transactionMetricsRequest.getTokenStandardAndDetails,
  );

  const isApproveMethod =
    contractMethodName === 'Approve' && tokenStandard === TokenStandard.ERC20;

  const transactionApprovalAmountType = getTransactionApprovalAmountType({
    isApproveMethod,
    tokenStandard,
    transactionMeta,
  });

  return {
    contractMethodName,
    contractMethod4Byte: transactionMeta.txParams?.data?.slice(0, 10),
    transactionTypeForMetrics: transactionType,
    isContractInteraction,
    isApproveMethod,
    assetType,
    tokenStandard,
    transactionApprovalAmountType,
  };
}

function determineTransactionTypeAndContractInteraction(
  type: string,
  originalType?: string,
): {
  transactionType: string;
  isContractInteraction: boolean;
} {
  const isContractInteraction = CONTRACT_INTERACTION_TYPES.includes(
    type as TransactionType,
  );

  const directTypeMappings = [
    'swapAndSend',
    'cancel',
    'deployContract',
    'gasPayment',
    'batch',
    'shieldSubscriptionApprove',
  ];

  if (directTypeMappings.includes(type)) {
    return {
      transactionType: type,
      isContractInteraction,
    };
  }

  if (type === 'retry' && originalType) {
    return {
      transactionType: originalType,
      isContractInteraction,
    };
  }

  if (isContractInteraction) {
    if (type === 'swap') {
      return {
        transactionType: 'mm_swap',
        isContractInteraction: true,
      };
    }
    if (type === 'bridge') {
      return {
        transactionType: 'mm_bridge',
        isContractInteraction: true,
      };
    }
    return {
      transactionType: 'contractInteraction',
      isContractInteraction: true,
    };
  }

  return {
    transactionType: 'simpleSend',
    isContractInteraction: false,
  };
}

function getTransactionApprovalAmountType({
  isApproveMethod,
  tokenStandard,
  transactionMeta,
}: {
  isApproveMethod: boolean;
  tokenStandard?: string;
  transactionMeta: TransactionMeta;
}): TransactionApprovalAmountType | undefined {
  if (!isApproveMethod || tokenStandard !== TokenStandard.ERC20) {
    return undefined;
  }

  if (
    transactionMeta.dappProposedTokenAmount === '0' ||
    transactionMeta.customTokenAmount === '0'
  ) {
    return TransactionApprovalAmountType.revoke;
  }

  if (
    transactionMeta.customTokenAmount &&
    transactionMeta.customTokenAmount !==
      transactionMeta.dappProposedTokenAmount
  ) {
    return TransactionApprovalAmountType.custom;
  }

  if (transactionMeta.dappProposedTokenAmount) {
    return TransactionApprovalAmountType.dappProposed;
  }

  return undefined;
}
