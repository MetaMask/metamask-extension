import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box, Text } from '@metamask/design-system-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { Transaction } from '@metamask/keyring-api';
import { isCrossChain } from '@metamask/bridge-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useScrollContainer } from '../../../contexts/scroll-container';
import { TransactionActivityEmptyState } from '../../app/transaction-activity-empty-state';
import {
  getRawNonEvmTransactions,
  getPendingTransactionGroups,
  getRecentTransactionGroups,
  getFirstEvmAddress,
} from '../../../selectors/activity';
import {
  getUseExternalServices,
  getSelectedAccount,
} from '../../../selectors/selectors';
import { selectBridgeHistoryForAccountGroup } from '../../../ducks/bridge-status/selectors';
import { useEarliestNonceByChain } from '../../../hooks/useEarliestNonceByChain';
import { queries } from '../../../../shared/acme-controller/queries';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';
import { MultichainTransactionDetailsModal } from '../../app/multichain-transaction-details-modal';
import MultichainBridgeTransactionListItem from '../../app/multichain-bridge-transaction-list-item/multichain-bridge-transaction-list-item';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import {
  mergeAllTransactionsByTime,
  groupAndFlattenMergedTransactions,
  filterLocalCompletedNotInApi,
  type FlattenedItem,
} from './helpers';
import { ActivityListItem } from './activity-list-item';
import { ActivityDetailsModalAdapter } from './activity-details-modal-adapter';
import { PendingActivityItem } from './pending-activity-item';
import { NonEvmActivityListItem } from './non-evm-activity-list-item';

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
  const [selectedNonEvmTransaction, setSelectedNonEvmTransaction] =
    useState<Transaction | null>(null);

  // Activity tab should show ALL transactions regardless of selected chain/network
  const evmAddress = useSelector(getFirstEvmAddress) || '';
  const selectedAccount = useSelector(getSelectedAccount);

  // Non-EVM transactions
  const nonEvmTransactions = useSelector(getRawNonEvmTransactions);

  // Pending transactions (unapproved/approved/submitted) - not in API
  const pendingTransactionGroups = useSelector(getPendingTransactionGroups);

  // Recently confirmed transactions - may not be in API yet
  const recentTransactionGroups = useSelector(getRecentTransactionGroups);

  // Bridge history for matching non-EVM transactions to bridge operations.
  const bridgeHistoryItems = useSelector(selectBridgeHistoryForAccountGroup);

  // EVM transactions from API
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      queries.transactions(evmAddress, {
        enabled: useExternalServices && Boolean(evmAddress),
      }),
    );

  // Merge and flatten for virtualization
  const flattenedItems = useMemo(() => {
    const evmTransactions =
      data?.pages?.flatMap((page) => page.data ?? []) ?? [];

    // Filter local completed transactions not yet in API (deduped by hash)
    const localCompletedNotInApi = filterLocalCompletedNotInApi(
      recentTransactionGroups,
      evmTransactions,
    );

    // Merge all four types by time:
    // - pending (TransactionGroup) → rendered by PendingActivityItem
    // - local-completed (TransactionGroup) → rendered by PendingActivityItem
    // - completed (TransactionViewModel) → rendered by ActivityListItem
    // - non-evm (Transaction) → rendered by old MultichainTransactionListItem pattern
    const mergedByTime = mergeAllTransactionsByTime(
      pendingTransactionGroups,
      localCompletedNotInApi,
      evmTransactions,
      nonEvmTransactions,
    );

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

  const handleNonEvmModalClose = () => {
    setSelectedNonEvmTransaction(null);
  };

  const renderItem = (item: FlattenedItem) => {
    if (item.type === 'date-header') {
      return (
        <Box className="px-4 py-2 bg-background-default">
          <Text className="text-sm text-alternative">
            {formatDateWithYearContext(item.date, 'MMM d, y', 'MMM d')}
          </Text>
        </Box>
      );
    }

    if (item.type === 'pending' || item.type === 'local-completed') {
      return (
        <PendingActivityItem
          transactionGroup={item.transactionGroup}
          earliestNonceByChain={earliestNonceByChain}
        />
      );
    }

    if (item.type === 'non-evm') {
      // Ported from unified-transaction-list.component.js L702-718
      const matchedBridgeHistoryItem = bridgeHistoryItems[item.id];

      if (
        matchedBridgeHistoryItem &&
        isCrossChain(
          matchedBridgeHistoryItem.quote?.srcChainId,
          matchedBridgeHistoryItem.quote?.destChainId,
        )
      ) {
        return (
          <MultichainBridgeTransactionListItem
            transaction={item.transaction}
            bridgeHistoryItem={matchedBridgeHistoryItem}
            toggleShowDetails={(tx) => setSelectedNonEvmTransaction(tx)}
          />
        );
      }

      return (
        <NonEvmActivityListItem
          transaction={item.transaction}
          onClick={() => setSelectedNonEvmTransaction(item.transaction)}
        />
      );
    }

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

        <ActivityDetailsModalAdapter
          isOpen={isModalOpen}
          onClose={handleModalClose}
          transaction={selectedItem}
        />

        {selectedNonEvmTransaction && (
          <MultichainTransactionDetailsModal
            transaction={selectedNonEvmTransaction}
            onClose={handleNonEvmModalClose}
            userAddress={selectedAccount?.address ?? ''}
          />
        )}
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
