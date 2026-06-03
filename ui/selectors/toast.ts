import {
  TransactionStatus,
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { createSelector } from 'reselect';
import { createDeepEqualSelector } from '../../shared/lib/selectors/selector-creators';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../shared/constants/app';
import type { MetaMaskReduxState } from '../store/store';
import {
  TOAST_EXCLUDED_NESTED_TRANSACTION_TYPES,
  TOAST_EXCLUDED_TRANSACTION_TYPES,
  TOAST_EXCLUDED_NON_EVM_TRANSACTION_TYPES,
} from '../helpers/constants/transactions';
import { isPerpsWithdrawTransaction } from '../../shared/lib/transactions.utils';
import { getPendingApprovals } from './approvals';
import { EMPTY_ARRAY, EMPTY_OBJECT } from './shared';
import {
  selectRequiredTransactionHashes,
  selectRequiredTransactionIds,
} from './transactionController';

const selectTransactions = (state: MetaMaskReduxState) =>
  state.metamask?.transactions ?? EMPTY_ARRAY;

const selectNonEvmTransactions = (state: MetaMaskReduxState) =>
  state.metamask?.nonEvmTransactions ?? EMPTY_OBJECT;

const selectTxHistory = (state: MetaMaskReduxState) =>
  state.metamask?.txHistory ?? EMPTY_OBJECT;

type TokenLike = {
  address?: string;
  symbol?: string;
};

export type PerpsWithdrawToastTransaction = {
  id: string;
  isPostQuote: boolean;
  status?: TransactionStatus;
  targetFiat?: number;
  tokenSymbol: string;
};

const selectAllTokens = (state: MetaMaskReduxState) =>
  state.metamask?.allTokens ?? EMPTY_OBJECT;

const selectNetworkConfigurationsByChainId = (state: MetaMaskReduxState) =>
  state.metamask?.networkConfigurationsByChainId ?? EMPTY_OBJECT;

function getTokenSymbol(
  allTokens: unknown,
  chainId?: string,
  tokenAddress?: string,
): string | undefined {
  if (!chainId || !tokenAddress) {
    return undefined;
  }

  const chainTokensByAccount =
    (allTokens as Record<string, Record<string, TokenLike[]>>)[chainId] ??
    EMPTY_OBJECT;
  const tokens = Object.values(chainTokensByAccount).flat();

  return tokens.find(
    (token) =>
      token.address?.toLowerCase() === tokenAddress.toLowerCase() &&
      token.symbol,
  )?.symbol;
}

function getNetworkTicker(
  networkConfigurationsByChainId: unknown,
  chainId?: string,
): string | undefined {
  if (!chainId) {
    return undefined;
  }

  return (
    networkConfigurationsByChainId as Record<
      string,
      { nativeCurrency?: string }
    >
  )[chainId]?.nativeCurrency;
}

function getPerpsWithdrawToastTransaction(
  transaction: TransactionMeta,
  allTokens: unknown,
  networkConfigurationsByChainId: unknown,
): PerpsWithdrawToastTransaction {
  const { metamaskPay } = transaction;

  if (metamaskPay?.isPostQuote !== true) {
    return {
      id: transaction.id,
      isPostQuote: false,
      status: transaction.status,
      tokenSymbol: 'USDC',
    };
  }

  const rawTargetFiat = Number(metamaskPay.targetFiat);
  const targetFiat =
    Number.isFinite(rawTargetFiat) && rawTargetFiat > 0
      ? rawTargetFiat
      : undefined;
  const { chainId } = metamaskPay;
  const { tokenAddress } = metamaskPay;
  const tokenSymbol =
    getTokenSymbol(allTokens, chainId, tokenAddress) ??
    getNetworkTicker(networkConfigurationsByChainId, chainId) ??
    'USDC';

  return {
    id: transaction.id,
    isPostQuote: true,
    status: transaction.status,
    targetFiat,
    tokenSymbol,
  };
}

export const selectTransactionIds = createSelector(
  selectTransactions,
  (transactions) => new Set<string>(transactions.map((tx) => tx.id)),
);

export const selectBridgeApprovalTxIds = createSelector(
  selectTxHistory,
  (txHistory) => {
    const ids = new Set<string>();
    for (const item of Object.values(txHistory)) {
      if (item.approvalTxId) {
        ids.add(item.approvalTxId.toLowerCase());
      }
    }
    return ids;
  },
);

export const selectCrossChainBridgeSourceTxIds = createSelector(
  selectTxHistory,
  (txHistory) => {
    const ids = new Set<string>();
    for (const [key, item] of Object.entries(txHistory)) {
      if (item.quote && item.quote.srcChainId !== item.quote.destChainId) {
        ids.add(key);
      }
    }
    return ids;
  },
);

/**
 * Returns EVM transactions eligible for toast notifications.
 *
 * @param {object} state - Root state
 * @returns {object[]} Filtered, deduplicated array of transaction objects
 */
export const selectEvmTransactionsForToast = createSelector(
  selectTransactions,
  selectBridgeApprovalTxIds,
  selectCrossChainBridgeSourceTxIds,
  selectRequiredTransactionIds,
  selectRequiredTransactionHashes,
  (
    rawTransactions,
    bridgeApprovalIds,
    crossChainBridgeIds,
    requiredTransactionIds,
    requiredTransactionHashes,
  ) => {
    if (!rawTransactions?.length) {
      return EMPTY_ARRAY;
    }

    const seen = new Set<string>();

    return rawTransactions.filter((transaction) => {
      if (seen.has(transaction.id)) {
        return false;
      }

      seen.add(transaction.id);

      const type = transaction?.type;
      if (typeof type !== 'string') {
        return false;
      }
      return (
        Boolean(type) &&
        !TOAST_EXCLUDED_TRANSACTION_TYPES.has(type) &&
        !bridgeApprovalIds.has(transaction.id?.toLowerCase()) &&
        !crossChainBridgeIds.has(transaction.id) &&
        !requiredTransactionIds.has(transaction.id) &&
        !(
          transaction.hash &&
          requiredTransactionHashes.has(transaction.hash.toLowerCase())
        )
      );
    });
  },
);

/**
 * Returns non-EVM transactions for toast notifications
 *
 * @param {object} state - Root state
 * @returns {object[]} Filtered array of non-EVM transaction objects
 */
export const selectNonEvmTransactionsForToast = createDeepEqualSelector(
  selectNonEvmTransactions,
  selectCrossChainBridgeSourceTxIds,
  (nonEvmTransactionsMap, crossChainBridgeIds) => {
    if (!nonEvmTransactionsMap) {
      return EMPTY_ARRAY;
    }

    return Object.values(nonEvmTransactionsMap)
      .flatMap((byChainMap) =>
        Object.values(byChainMap ?? {}).flatMap(
          (entry) => entry?.transactions ?? EMPTY_ARRAY,
        ),
      )
      .filter((transaction) => {
        const type = transaction?.type;
        return (
          Boolean(type) &&
          !TOAST_EXCLUDED_NON_EVM_TRANSACTION_TYPES.has(type) &&
          !crossChainBridgeIds.has(transaction.id)
        );
      });
  },
);

type TxRequest = {
  approvalId: string;
  txId: string;
  smartTransactionStatus: string | undefined;
  evmStatus: string | undefined;
};

function isTransactionTypeExcluded(transaction: TransactionMeta | undefined) {
  const type = transaction?.type;
  const isExcludedType = Boolean(
    type && TOAST_EXCLUDED_TRANSACTION_TYPES.has(type),
  );
  const isExcludedNestedType = Boolean(
    transaction?.nestedTransactions?.some(
      (nested) =>
        nested.type && TOAST_EXCLUDED_NESTED_TRANSACTION_TYPES.has(nested.type),
    ),
  );

  return isExcludedType || isExcludedNestedType;
}

function getEffectiveEvmStatus(
  txId: string,
  transactions: ReturnType<typeof selectTransactions>,
) {
  const originalTx = transactions.find((tx) => tx.id === txId);
  if (!originalTx) {
    return undefined;
  }

  if (
    originalTx.status === TransactionStatus.dropped &&
    originalTx.replacedById
  ) {
    const replacement = transactions.find(
      (tx) => tx.id === originalTx.replacedById,
    );
    if (replacement?.type === TransactionType.retry) {
      return replacement.status;
    }
  }

  return originalTx.status;
}

export const selectSmartTransactions = createDeepEqualSelector(
  getPendingApprovals,
  selectTransactions,
  (pendingApprovals, transactions) => {
    const result: TxRequest[] = [];

    for (const approval of pendingApprovals) {
      if (
        approval.type !==
        SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage
      ) {
        continue;
      }

      const { requestState = {} } = approval;
      const { txId, smartTransaction } = requestState as {
        txId?: string;
        smartTransaction?: { status?: string };
      };

      if (!txId) {
        continue;
      }

      const transaction = transactions.find((tx) => tx.id === txId);
      if (isTransactionTypeExcluded(transaction)) {
        continue;
      }

      result.push({
        approvalId: approval.id,
        txId,
        smartTransactionStatus: smartTransaction?.status,
        // Track EVM transaction status to detect cancels and speed ups
        evmStatus: getEffectiveEvmStatus(txId, transactions),
      });
    }

    return result;
  },
);

export const selectPerpsWithdrawTransactionsForToast = createDeepEqualSelector(
  selectTransactions,
  selectAllTokens,
  selectNetworkConfigurationsByChainId,
  (transactions, allTokens, networkConfigurationsByChainId) =>
    transactions
      .filter(isPerpsWithdrawTransaction)
      .map((transaction) =>
        getPerpsWithdrawToastTransaction(
          transaction,
          allTokens,
          networkConfigurationsByChainId,
        ),
      ),
);
