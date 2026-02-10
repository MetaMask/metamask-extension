import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box, Text } from '@metamask/design-system-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useScrollContainer } from '../../../contexts/scroll-container';
import { TransactionActivityEmptyState } from '../../app/transaction-activity-empty-state';
import {
  getNonEvmTransactions,
  getPendingTransactionGroups,
  getRecentTransactionGroups,
  getFirstEvmAddress,
} from '../../../selectors/activity';
import { getUseExternalServices } from '../../../selectors/selectors';
import { useEarliestNonceByChain } from '../../../hooks/useEarliestNonceByChain';
import { queries } from '../../../../shared/acme-controller/queries';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';
import {
  mergeAllTransactionsByTime,
  groupAndFlattenMergedTransactions,
  filterLocalCompletedNotInApi,
  formatDate,
  isDateHeader,
  isPendingItem,
  isLocalCompletedItem,
  type FlattenedItem,
} from './helpers';
import { ActivityListItem } from './activity-list-item';
import { ActivityDetailsModal } from './activity-details-modal';
import { PendingActivityItem } from './pending-activity-item';

const ITEM_HEIGHT = 70;
const HEADER_HEIGHT = 36;

export const ActivityList = () => {
  const t = useI18nContext();
  const scrollContainerRef = useScrollContainer();
  const useExternalServices = useSelector(getUseExternalServices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TransactionViewModel | null>(
    null,
  );

  // Activity tab should show ALL transactions regardless of selected chain/network
  const evmAddress = useSelector(getFirstEvmAddress) || '';

  // Non-EVM transactions - not in API
  const nonEvmTransactions = useSelector(getNonEvmTransactions);

  // Pending transactions (unapproved/approved/submitted) - not in API
  const pendingTransactionGroups = useSelector(getPendingTransactionGroups);

  // Recently confirmed transactions - may not be in API yet
  const recentTransactionGroups = useSelector(getRecentTransactionGroups);

  // Bridge history for enriching bridge transactions
  // const bridgeHistoryItems = useSelector(selectBridgeHistoryForAccountGroup);

  // EVM transactions from API
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      queries.transactions(evmAddress, {
        enabled: useExternalServices && Boolean(evmAddress),
      }),
    );

  // Merge all transactions and flatten for virtualization
  const flattenedItems = useMemo(() => {
    const evmTransactions =
      data?.pages?.flatMap((page) => page.data ?? []) ?? [];

    // Combine API (EVM) + non-EVM transactions - both are TransactionViewModel[]
    const allCompleted = [...evmTransactions, ...nonEvmTransactions];

    // Filter local completed transactions not yet in API (deduped by hash)
    const localCompletedNotInApi = filterLocalCompletedNotInApi(
      recentTransactionGroups,
      evmTransactions,
    );

    // Merge all three types by time:
    // - pending (TransactionGroup) → rendered by PendingActivityItem
    // - local-completed (TransactionGroup) → rendered by PendingActivityItem
    // - completed (TransactionViewModel) → rendered by ActivityListItem
    const mergedByTime = mergeAllTransactionsByTime(
      pendingTransactionGroups,
      localCompletedNotInApi,
      allCompleted,
    );

    // Group by date and flatten for virtualization
    return groupAndFlattenMergedTransactions(mergedByTime);
  }, [
    data,
    nonEvmTransactions,
    pendingTransactionGroups,
    recentTransactionGroups,
  ]);

  const virtualizer = useVirtualizer({
    count: flattenedItems.length,
    getScrollElement: () => scrollContainerRef?.current || null,
    estimateSize: (index: number) => {
      const item = flattenedItems[index];
      return item && item.type === 'date-header' ? HEADER_HEIGHT : ITEM_HEIGHT;
    },
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    if (scrollContainerRef?.current) {
      virtualizer.measure();
    }
  }, [scrollContainerRef, virtualizer]);

  // Fetch more items when scrolling near the end
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= flattenedItems.length - 10 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    hasNextPage,
    fetchNextPage,
    flattenedItems.length,
    isFetchingNextPage,
  ]);

  const earliestNonceByChain = useEarliestNonceByChain(
    pendingTransactionGroups,
  );

  const handleItemClick = (transaction: TransactionViewModel) => {
    setSelectedItem(transaction);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const renderItem = (item: FlattenedItem) => {
    if (isDateHeader(item)) {
      return (
        <Box className="px-4 py-2 bg-background-default">
          <Text className="text-sm text-alternative">
            {formatDate(item.date)}
          </Text>
        </Box>
      );
    }

    // Pending EVM transactions - delegate to v1's TransactionListItem
    if (isPendingItem(item)) {
      return (
        <PendingActivityItem
          transactionGroup={item.transactionGroup}
          earliestNonceByChain={earliestNonceByChain}
        />
      );
    }

    // Local completed transactions (confirmed but not yet in API)
    // Also delegate to v1's TransactionListItem for consistent rendering
    if (isLocalCompletedItem(item)) {
      return (
        <PendingActivityItem
          transactionGroup={item.transactionGroup}
          earliestNonceByChain={earliestNonceByChain}
        />
      );
    }

    // Completed transactions from API - use v2's ActivityListItem
    return (
      <ActivityListItem
        transaction={item.data}
        onClick={() => handleItemClick(item.data)}
      />
    );
  };

  if (flattenedItems.length > 0) {
    return (
      <Box>
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualItems.map((virtualItem) => {
            const item = flattenedItems[virtualItem.index];

            return (
              <div
                key={virtualItem.key.toString()}
                className="absolute top-0 left-0 w-full"
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {item && renderItem(item)}
              </div>
            );
          })}
        </div>

        {isFetchingNextPage && (
          <Box className="p-4 flex justify-center">
            <Text className="text-alternative">{t('loading')}</Text>
          </Box>
        )}

        <ActivityDetailsModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          transaction={selectedItem}
        />
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box className="p-4 flex justify-center">
        <Text>{t('loading')}</Text>
      </Box>
    );
  }

  return <TransactionActivityEmptyState />;
};
