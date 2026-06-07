import React, { useMemo, useState } from 'react';
import { Box, Text } from '@metamask/design-system-react';
import { PendingTransactionCancelSpeedUpProvider } from '../../components/app/pending-transaction-action-buttons/pending-transaction-cancel-speed-up-provider';
import AssetListControlBar from '../../components/app/assets/asset-list/asset-list-control-bar/asset-list-control-bar';
import { TransactionActivityEmptyState } from '../../components/app/transaction-activity-empty-state';
import { SectionHeader } from '../../components/ui/section-header';
import { VirtualizedList } from '../../components/ui/virtualized-list/virtualized-list';
import { useScrollContainer } from '../../contexts/scroll-container';
import { useFormatters } from '../../hooks/useFormatters';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useItemInView } from '../../hooks/useItemInView';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { TransactionDetailsModal } from '../details/transaction-details-modal';
import { ActivityRow } from './rows/activity-row';
import {
  dedupeItems,
  getLastEvmItemIndex,
  getItemKey,
  groupActivityListItems,
  type ActivityListFilter,
} from './helpers';
import { useLocalTransactions } from './useLocalTransactions';
import { useNonEvmTransactions } from './useNonEvmTransactions';
import { useTransactionsQuery } from './useTransactionsQuery';

const itemHeight = 70;
const headerHeight = 40;

export function ActivityList({ filter }: { filter?: ActivityListFilter } = {}) {
  const t = useI18nContext();
  const { formatMediumDate } = useFormatters();
  const scrollContainerRef = useScrollContainer();
  const [networks, setNetworks] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<ActivityListItem>();
  const filters = filter ?? { networks };

  const { data, isInitialLoading, fetchNextVisiblePage } =
    useTransactionsQuery(filters);

  const localItems = useLocalTransactions(filters);
  const nonEvmItems = useNonEvmTransactions(filters);
  const evmItems = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const groupedItems = useMemo(() => {
    const items = dedupeItems(localItems, evmItems, nonEvmItems);

    return groupActivityListItems(items);
  }, [evmItems, localItems, nonEvmItems]);

  const lastEvmItemIndex = useMemo(
    () => getLastEvmItemIndex(groupedItems, evmItems),
    [evmItems, groupedItems],
  );

  const itemRef = useItemInView({
    targetIndex: lastEvmItemIndex,
    root: scrollContainerRef?.current ?? null,
    onVisible: fetchNextVisiblePage,
  });

  const handleClick = (item: ActivityListItem) => {
    if (!item.data.hash) {
      return;
    }

    setSelectedItem(item);
  };
  return (
    <PendingTransactionCancelSpeedUpProvider>
      {!filter && (
        <AssetListControlBar
          showSortControl={false}
          showImportTokenButton={false}
          onNetworkSelect={setNetworks}
        />
      )}

      <VirtualizedList
        data={groupedItems}
        estimatedItemSize={(row) =>
          row.type === 'date-header' || row.type === 'pending-header'
            ? headerHeight
            : itemHeight
        }
        overscan={10}
        keyExtractor={getItemKey}
        itemRef={itemRef}
        listEmptyComponent={
          isInitialLoading ? (
            <Box className="p-4">
              <Text>{t('loading')}</Text>
            </Box>
          ) : (
            <TransactionActivityEmptyState className="mx-auto mt-5 mb-6" />
          )
        }
        enableScrollMargin={Boolean(filter)}
        renderItem={({ item: row }) => {
          if (row.type === 'pending-header') {
            return <SectionHeader label={t('pending')} />;
          }

          if (row.type === 'date-header') {
            return <SectionHeader label={formatMediumDate(row.date)} />;
          }

          return (
            <ActivityRow
              data={row.item}
              onClick={() => handleClick(row.item)}
            />
          );
        }}
      />
      <TransactionDetailsModal
        isOpen={Boolean(selectedItem?.data.hash)}
        chainId={selectedItem?.chainId}
        txIdentifier={selectedItem?.data.hash}
        onClose={() => setSelectedItem(undefined)}
      />
    </PendingTransactionCancelSpeedUpProvider>
  );
}
