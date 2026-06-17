import type { InfiniteData } from '@tanstack/react-query';
import type {
  V1TransactionByHashResponse,
  V4MultiAccountTransactionsResponse,
} from '@metamask/core-backend';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { mapApiEvmTransactions } from '../../../../shared/lib/activity/adapters/api-evm-transactions';
import { selectProtectedLocalTransactions } from '../../../selectors/activity';
import { selectRequiredTransactionHashes } from '../../../selectors/transactionController';
import { activityMatchesAssetId, type ActivityListFilter } from '../helpers';
import { isExcludedTransactionHash } from './excluded-transaction-hash';
import { isIncomingNativeAssetTransfer } from './incoming-native-asset-transfer';
import { isIncomingTokenTransfer } from './incoming-token-transfer';
import { isSpamTransaction } from './spam-transactions';
import { isTopLevelAccountTransaction } from './top-level-account-transaction';
import { isZeroValueSelfSend } from './zero-value-self-send';

type Props = ActivityListFilter & { subjectAddress: string };

export function useQueryFilters(queryFilters: Props) {
  const { subjectAddress } = queryFilters;
  const excludedHashes = useSelector(selectRequiredTransactionHashes);
  const protectedLocalTransactions = useSelector(
    selectProtectedLocalTransactions,
  );
  const assetId = 'assetId' in queryFilters ? queryFilters.assetId : undefined;

  return useCallback(
    (data: InfiniteData<V4MultiAccountTransactionsResponse>) => {
      // Ideally we'd want to move some of these filters to the API
      const txFilters: ((tx: V1TransactionByHashResponse) => boolean)[] = [
        (tx) => isTopLevelAccountTransaction(tx, subjectAddress),
        (tx) => !isSpamTransaction(tx),
        (tx) => !isZeroValueSelfSend(tx, subjectAddress),
        (tx) => !isIncomingTokenTransfer(tx, subjectAddress),
        (tx) => !isIncomingNativeAssetTransfer(tx, subjectAddress),
        (tx) => !isExcludedTransactionHash(tx, excludedHashes),
      ];
      // This really should be moved to the API
      const activityFilters: ((
        activity: ReturnType<typeof mapApiEvmTransactions>,
      ) => boolean)[] = [
        (activity) => !assetId || activityMatchesAssetId(activity, assetId),
      ];

      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          data: page.data
            .filter((transaction) =>
              txFilters.every((filter) => filter(transaction)),
            )
            .map((transaction) =>
              mapApiEvmTransactions({ subjectAddress, transaction }),
            )
            .map((activity) => {
              const hash = activity.hash?.toLowerCase();

              return activity.status === 'failed' &&
                hash &&
                protectedLocalTransactions.has(hash)
                ? { ...activity, status: 'cancelled' as const }
                : activity;
            })
            .filter((activity) =>
              activityFilters.every((filter) => filter(activity)),
            ),
        })),
      };
    },
    [assetId, excludedHashes, protectedLocalTransactions, subjectAddress],
  );
}
