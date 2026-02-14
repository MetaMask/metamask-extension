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
import { PENDING_STATUS_HASH } from '../../../helpers/constants/transactions';
import { selectLocalTransactions } from '../../../selectors/activity';
import { selectEvmAddress } from '../../../selectors/accounts';
import { selectCurrentAccountNonEvmTransactions } from '../../../selectors/multichain-transactions';
import { getAllEnabledNetworksForAllNamespaces } from '../../../selectors/multichain/networks';
import { selectBridgeHistoryForAccountGroup } from '../../../ducks/bridge-status/selectors';
import { useEarliestNonceByChain } from '../../../hooks/useEarliestNonceByChain';
import { queries } from '../../../../shared/lib/multichain/queries';
import type { TransactionViewModel } from '../../../../shared/lib/multichain/types';
import { MultichainTransactionDetailsModal as LegacyMultichainTransactionDetailsModal } from '../../app/multichain-transaction-details-modal';
import LegacyMultichainBridgeListItem from '../../app/multichain-bridge-transaction-list-item/multichain-bridge-transaction-list-item';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import AssetListControlBar from '../../app/assets/asset-list/asset-list-control-bar';
import { getUseExternalServices } from '../../../selectors';
import {
  mergeAllTransactionsByTime,
  groupAndFlattenMergedTransactions,
  filterLocalNotInApi,
  type FlattenedItem,
} from './helpers';
import { ActivityListItem } from './activity-list-item';
import { ActivityDetailsModalAdapter } from './activity-details-modal-adapter';
import { LocalActivityListItem } from './local-activity-list-item';
import { NonEvmActivityListItem } from './non-evm-activity-list-item';

const ITEM_HEIGHT = 70;
const HEADER_HEIGHT = 36;

export const ActivityList = () => {
  const t = useI18nContext();
  const scrollContainerRef = useScrollContainer();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TransactionViewModel | null>(
    null,
  );
  const [selectedNonEvmTransaction, setSelectedNonEvmTransaction] =
    useState<Transaction | null>(null);

  const evmAddress = useSelector(selectEvmAddress) || '';
  const enabledNetworks = useSelector(getAllEnabledNetworksForAllNamespaces);
  const useExternalServices = useSelector(getUseExternalServices);

  // Clear modal state on account switch
  useEffect(() => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setSelectedNonEvmTransaction(null);
  }, [evmAddress]);

  // EVM transactions - from API
  const {
    data,
    isInitialLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    queries.transactions(evmAddress, {
      enabled: useExternalServices,
    }),
  );

  // Local transactions - may not be in API yet
  const localTransactions = useSelector(selectLocalTransactions);

  // Non-EVM transactions - not in API
  const nonEvmTransactions = useSelector(
    selectCurrentAccountNonEvmTransactions,
  );

  // Bridge history for matching non-EVM transactions to bridge operations
  const bridgeHistoryItems = useSelector(selectBridgeHistoryForAccountGroup);

  // Merge and flatten for virtualization
  const flattenedItems = useMemo(() => {
    const selectedChain =
      enabledNetworks.length === 1 ? enabledNetworks[0] : null;

    const evmTransactions = (
      data?.pages?.flatMap((page) => page.data ?? []) ?? []
    ).filter((tx) => !selectedChain || tx.chainId === selectedChain);

    // Filter local transactions: keep pending + completed-not-in-API
    const localTransactionsNotInApi = filterLocalNotInApi(
      localTransactions,
      evmTransactions,
      PENDING_STATUS_HASH,
    ).filter(
      (group) =>
        !selectedChain || group.initialTransaction?.chainId === selectedChain,
    );

    const filteredNonEvmTransactions = nonEvmTransactions.filter(
      (tx) => !selectedChain || tx.chain === selectedChain,
    );

    // Merge all three types by time:
    // - local (TransactionGroup) → rendered by LocalActivityItem
    // - completed (TransactionViewModel) → rendered by ActivityListItem
    // - non-evm (Transaction) → rendered by either LegacyMultichainBridgeListItem or NonEvmActivityListItem
    const mergedByTime = mergeAllTransactionsByTime(
      localTransactionsNotInApi,
      evmTransactions,
      filteredNonEvmTransactions,
    );

    return groupAndFlattenMergedTransactions(mergedByTime);
  }, [data, nonEvmTransactions, localTransactions, enabledNetworks]);

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

  const earliestNonceByChain = useEarliestNonceByChain(localTransactions);

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

    if (item.type === 'local') {
      return (
        <LocalActivityListItem
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
          <LegacyMultichainBridgeListItem
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

  return (
    <Box>
      <AssetListControlBar
        showSortControl={false}
        showImportTokenButton={false}
      />

      {flattenedItems.length > 0 && (
        <>
          <div
            className="relative w-full"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualItems.map((virtualItem) => {
              const item = flattenedItems[virtualItem.index];

              return (
                <div
                  key={String(virtualItem.key)}
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
            <LegacyMultichainTransactionDetailsModal
              transaction={selectedNonEvmTransaction}
              onClose={handleNonEvmModalClose}
            />
          )}
        </>
      )}

      {isInitialLoading && flattenedItems.length === 0 && (
        <Box className="p-4 flex justify-center">
          <Text>{t('loading')}</Text>
        </Box>
      )}

      {!isInitialLoading && flattenedItems.length === 0 && (
        <TransactionActivityEmptyState className="mx-auto mt-5 mb-6" />
      )}
    </Box>
  );
};
