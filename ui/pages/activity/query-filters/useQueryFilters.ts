import type { InfiniteData } from '@tanstack/react-query';
import type {
  V5MultiAccountTransactionsResponse,
  V5TransactionRecord,
} from '@metamask/core-backend';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { mapV5ApiTransaction } from '@metamask/client-utils';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { selectProtectedLocalTransactions } from '../../../selectors/activity';
import { selectRampsSettlementHashes } from '../../../selectors/rampsController';
import { selectRequiredTransactionHashes } from '../../../selectors/transactionController';
import { activityMatchesAssetId, type ActivityListFilter } from '../helpers';
import { isExcludedTransactionHash } from './excluded-transaction-hash';
import { isZeroValueSelfSend } from './zero-value-self-send';

type Props = ActivityListFilter & { subjectAddress: string };

export function useQueryFilters(queryFilters: Props) {
  const { subjectAddress } = queryFilters;
  const requiredHashes = useSelector(selectRequiredTransactionHashes);
  const rampHashes = useSelector(selectRampsSettlementHashes);
  const excludedHashes = useMemo(
    () => new Set([...requiredHashes, ...rampHashes]),
    [requiredHashes, rampHashes],
  );
  const protectedLocalTransactions = useSelector(
    selectProtectedLocalTransactions,
  );
  const assetId = 'assetId' in queryFilters ? queryFilters.assetId : undefined;

  return useCallback(
    (data: InfiniteData<V5MultiAccountTransactionsResponse>) => {
      // Ideally we'd want to move some of these filters to the API
      const txFilters: ((tx: V5TransactionRecord) => boolean)[] = [
        (tx) => !isZeroValueSelfSend(tx, subjectAddress),
        (tx) => !isExcludedTransactionHash(tx, excludedHashes),
      ];
      // This really should be moved to the API
      const activityFilters: ((activity: ActivityListItem) => boolean)[] = [
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
            .map((transaction) => mapV5ApiTransaction({ transaction }))
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
