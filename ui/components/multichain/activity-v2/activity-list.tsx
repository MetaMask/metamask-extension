import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box, Text } from '@metamask/design-system-react';
import type { Transaction } from '@metamask/keyring-api';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useScrollContainer } from '../../../contexts/scroll-container';
import { TransactionActivityEmptyState } from '../../app/transaction-activity-empty-state';
import { PENDING_STATUS_HASH } from '../../../helpers/constants/transactions';
import { selectLocalTransactions } from '../../../selectors/activity';
import { selectEvmAddress } from '../../../selectors/accounts';
import { selectCurrentAccountNonEvmTransactions } from '../../../selectors/multichain-transactions';
import { selectEnabledNetworksAsCaipChainIds } from '../../../selectors/multichain/networks';
import { useEarliestNonceByChain } from '../../../hooks/useEarliestNonceByChain';
import type { TransactionViewModel } from '../../../../shared/lib/multichain/types';
import { MultichainTransactionDetailsModal as LegacyMultichainTransactionDetailsModal } from '../../app/multichain-transaction-details-modal';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import AssetListControlBar from '../../app/assets/asset-list/asset-list-control-bar';
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
import { useTransactionsQuery } from './hooks';

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

  const evmAddress = (useSelector(selectEvmAddress) || '').toLowerCase();
  const enabledNetworks = useSelector(selectEnabledNetworksAsCaipChainIds);

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
  } = useTransactionsQuery();

  // Local transactions - may not be in API yet
  const localTransactions = useSelector(selectLocalTransactions);

  // Non-EVM transactions - not in API
  const nonEvmTransactions = useSelector(
    selectCurrentAccountNonEvmTransactions,
  );

  // Merge and flatten for virtualization
  const flattenedItems = useMemo(() => {
    const evmTransactions =
      data?.pages?.flatMap((page) => page.data ?? []) ?? [];

    // Filter local transactions by converting hex chainId to CAIP-2
    const filteredLocalTransactions = filterLocalNotInApi(
      localTransactions,
      evmTransactions,
      PENDING_STATUS_HASH,
    ).filter((group) => {
      const chainId = group.initialTransaction?.chainId;
      return !chainId || enabledNetworks.includes(toEvmCaipChainId(chainId));
    });

    const filteredNonEvmTransactions = nonEvmTransactions.filter((tx) =>
      enabledNetworks.includes(tx.chain),
    );

    // Merge all three types by time
    const mergedByTime = mergeAllTransactionsByTime(
      filteredLocalTransactions,
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
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const lastVirtualItemIndex =
    virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : -1;

  useEffect(() => {
    if (scrollContainerRef?.current) {
      virtualizer.measure();
    }
  }, [scrollContainerRef, virtualizer]);

  // Fetch more items when scrolling near the end
  useEffect(() => {
    if (
      lastVirtualItemIndex >= 0 &&
      lastVirtualItemIndex >= flattenedItems.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    lastVirtualItemIndex,
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
      return (
        <NonEvmActivityListItem
          transaction={item.transaction}
          onClick={(tx) => setSelectedNonEvmTransaction(tx)}
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

      {!isInitialLoading && flattenedItems.length > 0 && (
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
        </>
      )}

      {!isInitialLoading && flattenedItems.length === 0 && (
        <TransactionActivityEmptyState className="mx-auto mt-5 mb-6" />
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
    </Box>
  );
};
