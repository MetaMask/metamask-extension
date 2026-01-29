import { createSelector } from 'reselect';
import {
  TransactionStatus,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { submittedPendingTransactionsSelector } from './transactions';

/**
 * Transforms pending TransactionMeta to V1 API shape
 * Minimal transformation - only what's needed
 */
export const getPendingTransactionsAsApiShape = createSelector(
  submittedPendingTransactionsSelector,
  (pendingTxs) =>
    (pendingTxs as TransactionMeta[]).map((tx) => ({
      hash: tx.hash || '',
      timestamp: new Date(tx.time).toISOString(),
      chainId: parseInt(tx.chainId, 16), // Convert hex to number to match API format
      blockNumber: 0,
      blockHash: '',
      gas: 0, // Not used by display logic
      gasUsed: 0,
      gasPrice: tx.txParams.gasPrice || tx.txParams.maxFeePerGas || '0',
      effectiveGasPrice:
        tx.txParams.gasPrice || tx.txParams.maxFeePerGas || '0',
      nonce: 0, // Not used by display logic
      cumulativeGasUsed: 0,
      value: tx.txParams.value || '0x0',
      to: tx.txParams.to || '',
      from: tx.txParams.from || '',
      isError: tx.status === TransactionStatus.failed,
      // Keep reference to original for pending actions
      pendingTransactionMeta: tx,
    })),
);
