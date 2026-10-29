import {
  TransactionMeta,
  TransactionType,
  hasTransactionType,
} from '@metamask/transaction-controller';
import {
  TokenStandard,
  TransactionApprovalAmountType,
} from '../../../../shared/constants/transaction';
import { determineTransactionAssetType } from '../../../../shared/lib/transaction.utils';
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
      transactionMeta,
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

/**
 * Pay flows submitted with `addTransactionBatch` keep `batch` as the parent
 * type. `hasTransactionType` from the transaction controller matches a nested
 * call, which is how mobile's `getTransactionTypeValue` resolves these.
 *
 * `getTransactionType` is not used here: a deposit batch is
 * `[approve, deposit]`, so the first nested type is `tokenMethodApprove`.
 */
const NESTED_PAY_TRANSACTION_TYPES: [TransactionType, string][] = [
  [TransactionType.moneyAccountDeposit, 'money_account_deposit'],
  [TransactionType.moneyAccountWithdraw, 'money_account_withdraw'],
];

function getNestedPayTransactionType(
  transactionMeta: TransactionMeta | undefined,
): string | undefined {
  const match = NESTED_PAY_TRANSACTION_TYPES.find(([transactionType]) =>
    hasTransactionType(transactionMeta, [transactionType]),
  );

  return match?.[1];
}

function determineTransactionTypeAndContractInteraction(
  type: string,
  originalType: string | undefined,
  transactionMeta: TransactionMeta | undefined,
): {
  transactionType: string;
  isContractInteraction: boolean;
} {
  const isContractInteraction = CONTRACT_INTERACTION_TYPES.includes(
    type as TransactionType,
  );

  const nestedPayTransactionType = getNestedPayTransactionType(transactionMeta);

  if (nestedPayTransactionType) {
    return {
      transactionType: nestedPayTransactionType,
      isContractInteraction,
    };
  }

  const directTypeMappings: Record<string, string> = {
    swapAndSend: 'swap_and_send',
    cancel: 'cancel',
    deployContract: 'deploy_contract',
    gasPayment: 'gas_payment',
    batch: 'batch',
    shieldSubscriptionApprove: 'shield_subscription_approve',
    musdConversion: 'musd_conversion',
    musdClaim: 'musd_claim',
    perpsDeposit: 'perps_deposit',
    perpsWithdraw: 'perps_withdraw',
  };

  if (type in directTypeMappings) {
    return {
      transactionType: directTypeMappings[type],
      isContractInteraction,
    };
  }

  if (type === 'retry' && originalType) {
    return determineTransactionTypeAndContractInteraction(
      originalType,
      undefined,
      transactionMeta,
    );
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
