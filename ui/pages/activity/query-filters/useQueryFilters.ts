import type { InfiniteData } from '@tanstack/react-query';
import type {
  V1TransactionByHashResponse,
  V4MultiAccountTransactionsResponse,
} from '@metamask/core-backend';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { mapApiEvmTransactions } from '../../../../shared/lib/activity/adapters/api-evm-transactions';
import { selectRequiredTransactionHashes } from '../../../selectors/transactionController';
import { isExcludedTransactionHash } from './excluded-transaction-hash';
import { isIncomingNativeAssetTransfer } from './incoming-native-asset-transfer';
import { isIncomingTokenTransfer } from './incoming-token-transfer';
import { isSpamTransaction } from './spam-transactions';
import { isTopLevelAccountTransaction } from './top-level-account-transaction';
import { isZeroValueSelfSend } from './zero-value-self-send';

export function useQueryFilters(subjectAddress: string) {
  const excludedHashes = useSelector(selectRequiredTransactionHashes);

  return useCallback(
    (data: InfiniteData<V4MultiAccountTransactionsResponse>) => {
      // Ideally we'd want to move some of these filters to the backend
      const filters: ((tx: V1TransactionByHashResponse) => boolean)[] = [
        (tx) => isTopLevelAccountTransaction(tx, subjectAddress),
        (tx) => !isSpamTransaction(tx),
        (tx) => !isZeroValueSelfSend(tx, subjectAddress),
        (tx) => !isIncomingTokenTransfer(tx, subjectAddress),
        (tx) => !isIncomingNativeAssetTransfer(tx, subjectAddress),
        (tx) => !isExcludedTransactionHash(tx, excludedHashes),
      ];

      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          data: page.data
            .filter((transaction) =>
              filters.every((filter) => filter(transaction)),
            )
            .map((transaction) =>
              mapApiEvmTransactions({ subjectAddress, transaction }),
            ),
        })),
      };
    },
    [excludedHashes, subjectAddress],
  );
}
