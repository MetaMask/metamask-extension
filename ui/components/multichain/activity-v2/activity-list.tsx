import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box, Text } from '@metamask/design-system-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useScrollContainer } from '../../../contexts/scroll-container';
import { TransactionActivityEmptyState } from '../../app/transaction-activity-empty-state';
import {
  getPendingTransactions,
  getMarketRates,
} from '../../../selectors/activity';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import type {
  FlattenedItem,
  TransactionViewModel,
} from '../../../../shared/acme-controller/types';
import { getSelectedInternalAccount } from '../../../selectors/accounts';
import { queries } from '../../../../shared/acme-controller/queries';
import { filterTransactions } from '../../../../shared/acme-controller/business-logic';
import {
  groupTransactionsByDate,
  flattenGroupedTransactions,
  mergeTransactions,
  formatDate,
} from './helpers';
import { ActivityListItem } from './activity-list-item';
import { ActivityDetailsModal } from './activity-details-modal';

const ITEM_HEIGHT = 70;
const HEADER_HEIGHT = 36;

export const ActivityList = () => {
  const t = useI18nContext();
  const scrollContainerRef = useScrollContainer();
  const accountAddress = useSelector(getSelectedInternalAccount)?.address;
  // Pending transactions are still in Redux
  const pendingTransactions = useSelector(getPendingTransactions);
  const marketRates = useSelector(getMarketRates);
  const currentCurrency = useSelector(getCurrentCurrency);

  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionViewModel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleItemClick = (transaction: TransactionViewModel) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  // Fetch transactions using React Query
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(queries.transactions(accountAddress));

  const filteredData = useMemo(() => {
    return data ? filterTransactions(data, accountAddress) : undefined;
  }, [data, accountAddress]);

  // Merge pending and confirmed transactions, then flatten for virtualization
  const flattenedItems: FlattenedItem[] = useMemo(() => {
    if (!filteredData?.pages) {
      return [];
    }

    const apiTransactions = filteredData.pages.flatMap(
      (page) => page.data ?? [],
    );

    const allTransactions = mergeTransactions(
      pendingTransactions,
      apiTransactions,
    );

    const grouped = groupTransactionsByDate(allTransactions);
    return flattenGroupedTransactions(grouped);
  }, [filteredData, pendingTransactions]);

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
                {item &&
                  (item.type === 'date-header' ? (
                    <Box className="px-4 py-2 bg-background-default">
                      <Text className="text-sm text-alternative">
                        {formatDate(item.date)}
                      </Text>
                    </Box>
                  ) : (
                    <ActivityListItem
                      transaction={item.data}
                      onClick={() => handleItemClick(item.data)}
                      marketRates={marketRates}
                      currentCurrency={currentCurrency}
                    />
                  ))}
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
