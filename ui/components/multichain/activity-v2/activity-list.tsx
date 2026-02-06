import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box, Text } from '@metamask/design-system-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useScrollContainer } from '../../../contexts/scroll-container';
import { TransactionActivityEmptyState } from '../../app/transaction-activity-empty-state';
import {
  getMarketRates,
  getNonEvmTransactions,
} from '../../../selectors/activity';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { getSelectedInternalAccount } from '../../../selectors/accounts';
import { queries } from '../../../../shared/acme-controller/queries';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';
import {
  groupTransactionsByDate,
  flattenGroupedTransactions,
  mergeTransactions,
  formatDate,
  isDateHeader,
  type FlattenedItem,
} from './helpers';
import { ActivityListItem } from './activity-list-item';
import { ActivityDetailsModal } from './activity-details-modal';

const ITEM_HEIGHT = 70;
const HEADER_HEIGHT = 36;

export const ActivityList = () => {
  const t = useI18nContext();
  const scrollContainerRef = useScrollContainer();
  const accountAddress = useSelector(getSelectedInternalAccount)?.address;
  // Pending transactions sourced from Redux

  // It wont be here after Confirmed
  // const pendingFromSelectedAccount = useSelector(
  //   nonceSortedPendingTransactionsSelectorAllChains,
  // );

  /*
   TODO:
   - check pendingFromSelectedAccount
   - check primaryTransaction? is type swap isBridge (see transaction-list-item.component.js)
   const isBridgeTx =
    transactionGroup.initialTransaction.type === TransactionType.bridge;
  const {
    bridgeTxHistoryItem,
    isBridgeComplete,
    showBridgeTxDetails,
    isBridgeFailed,
  } = useBridgeTxHistoryData({
    transactionGroup,
    isEarliestNonce,
  });

  then render this for the left side bottom part:
  !FINAL_NON_CONFIRMED_STATUSES.includes(status) &&
          isBridgeTx &&
          !(isBridgeComplete || isBridgeFailed) &&
          bridgeTxHistoryItem ? (
            <BridgeActivityItemTxSegments
              bridgeTxHistoryItem={bridgeTxHistoryItem}
              transactionGroup={transactionGroup}
            />
  */

  const pendingTransactions = []; // useSelector(getPendingTransactions);

  // Non-EVM transactions sourced from Redux
  const nonEvmTransactions = useSelector(getNonEvmTransactions);

  const marketRates = useSelector(getMarketRates);
  const currentCurrency = useSelector(getCurrentCurrency);

  const [selectedItem, setSelectedItem] = useState<TransactionViewModel | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleItemClick = (transaction: TransactionViewModel) => {
    setSelectedItem(transaction);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(queries.transactions(accountAddress));

  // Merge completed and non-EVM transactions, then flatten for virtualization
  const flattenedItems = useMemo(() => {
    if (!data?.pages) {
      return [];
    }

    const apiTransactions = data.pages.flatMap((page) => page.data ?? []);

    const allTransactions = mergeTransactions(
      [], // TODO: pendingTransactions
      apiTransactions,
      nonEvmTransactions,
    );

    const grouped = groupTransactionsByDate(allTransactions);
    return flattenGroupedTransactions(grouped);
  }, [data, nonEvmTransactions]);

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

    return (
      <ActivityListItem
        transaction={item.data}
        onClick={() => handleItemClick(item.data)}
        marketRates={marketRates}
        currentCurrency={currentCurrency}
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
