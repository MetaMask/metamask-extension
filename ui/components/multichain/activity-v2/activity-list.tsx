import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box, Text } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useScrollContainer } from '../../../contexts/scroll-container';
import { TransactionActivityEmptyState } from '../../app/transaction-activity-empty-state';
import { getPendingTransactionsAsApiShape } from '../../../selectors/activity';
import { useActivityQuery } from '../../../hooks/useActivityQuery';
import {
  groupTransactionsByDate,
  flattenGroupedTransactions,
} from '../../../helpers/transaction-filtering-logic';
import { mergeActivityTransactions } from '../../../helpers/activity-adapters';
import { FlattenedItem } from '../../../helpers/types';
import type { TransactionForDisplay } from '../../../helpers/types';
import { ActivityListItem } from './activity-list-item';
import { ActivityDetailsModal } from './activity-details-modal';

const ITEM_HEIGHT = 70;
const HEADER_HEIGHT = 36;

export const ActivityList = () => {
  const t = useI18nContext();
  const scrollContainerRef = useScrollContainer();

  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionForDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleItemClick = (transaction: TransactionForDisplay) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  // Get pending transactions already transformed to API shape
  const pendingTransactions = useSelector(getPendingTransactionsAsApiShape);

  // Fetch transactions using React Query
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useActivityQuery();

  // Merge pending and confirmed transactions, then flatten for virtualization
  const flattenedItems: FlattenedItem[] = useMemo(() => {
    if (!data?.pages) {
      return [];
    }
    const apiTransactions = data.pages.flatMap((page) => page.data ?? []);

    // Merge pending transactions with API transactions
    const allTransactions = mergeActivityTransactions(
      pendingTransactions,
      apiTransactions,
    );

    const grouped = groupTransactionsByDate(allTransactions);
    return flattenGroupedTransactions(grouped);
  }, [data, pendingTransactions]);

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
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {item &&
                  (item.type === 'date-header' ? (
                    <Box className="px-4 py-2 bg-background-default">
                      <Text className="text-sm text-alternative">
                        {item.date}
                      </Text>
                    </Box>
                  ) : (
                    <ActivityListItem
                      transaction={item.data}
                      onClick={() => handleItemClick(item.data)}
                    />
                  ))}
              </div>
            );
          })}
        </div>

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <Box className="p-4 flex justify-center">
            <Text className="text-alternative">{t('loading')}...</Text>
          </Box>
        )}

        <ActivityDetailsModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          transaction={selectedTransaction}
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
