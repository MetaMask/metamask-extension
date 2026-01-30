import { createSelector } from 'reselect';
import {
  TransactionStatus,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { transactionsSelector } from './transactions';

/**
 * Transforms submitted (pending) transactions to API-compatible shape
 * These take precedence over API data in merge logic
 */
export const getPendingTransactionsAsApiShape = createSelector(
  transactionsSelector,
  (allTxs) =>
    (allTxs as TransactionMeta[])
      .filter((tx) => tx.status === TransactionStatus.submitted)
      .map((tx) => {
        let transactionType: string | undefined;
        if (tx.type === 'transfer' || tx.type === 'transferFrom') {
          transactionType = 'ERC_20_TRANSFER';
        } else if (tx.type === 'approve') {
          transactionType = 'ERC_20_APPROVE';
        } else if (tx.type === 'swap') {
          transactionType = 'METAMASK_V1_EXCHANGE';
        }

        return {
          hash: tx.hash || '',
          timestamp: new Date(tx.time).toISOString(),
          chainId: parseInt(tx.chainId, 16),
          value: tx.txParams.value || '0x0',
          to: tx.txParams.to || '',
          from: tx.txParams.from || '',
          isError: false,
          transactionType,
          pendingTransactionMeta: tx,
        };
      }),
);
