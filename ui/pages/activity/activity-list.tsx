import React, { useMemo, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { PendingTransactionCancelSpeedUpProvider } from '../../components/app/pending-transaction-action-buttons/pending-transaction-cancel-speed-up-provider';
import AssetListControlBar from '../../components/app/assets/asset-list/asset-list-control-bar/asset-list-control-bar';
import { TransactionActivityEmptyState } from '../../components/app/transaction-activity-empty-state';
import { SectionHeader } from '../../components/ui/section-header';
import Spinner from '../../components/ui/spinner';
import { VirtualizedList } from '../../components/ui/virtualized-list/virtualized-list';
import { useScrollContainer } from '../../contexts/scroll-container';
import { useFormatters } from '../../hooks/useFormatters';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useItemInView } from '../../hooks/useItemInView';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
// eslint-disable-next-line import-x/no-restricted-paths
import { TransactionDetailsModal } from '../details/transaction-details-modal';
import { ActivityRow } from './rows/activity-row';
import {
  dedupeItems,
  getLastEvmItemIndex,
  getItemKey,
  groupActivityListItems,
  type ActivityListFilter,
} from './helpers';
import { useActivityScreenOpened } from './useActivityScreenOpened';
import { useLocalTransactions } from './useLocalTransactions';
import { useNonEvmTransactions } from './useNonEvmTransactions';
import { useTransactionsQuery } from './useTransactionsQuery';

const itemHeight = 62;
const headerHeight = 40;

export function ActivityList({ filter }: { filter?: ActivityListFilter } = {}) {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { formatMediumDate } = useFormatters();
  const scrollContainerRef = useScrollContainer();
  // null = not yet initialised by AssetListControlBar; [] = no filter applied
  const [networks, setNetworks] = useState<string[] | null>(null);
  const [selectedItem, setSelectedItem] = useState<ActivityListItem | null>(
    null,
  );
  const filters = filter ?? { networks: networks ?? [] };

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

  useActivityScreenOpened({
    filter,
    isSettled: networks !== null && !isInitialLoading,
    isEmpty: groupedItems.length === 0,
    pendingLength: [...localItems, ...nonEvmItems].filter(
      (item) => item.status === 'pending',
    ).length,
  });

  const itemRef = useItemInView({
    targetIndex: lastEvmItemIndex,
    root: scrollContainerRef?.current ?? null,
    onVisible: fetchNextVisiblePage,
  });

  const handleClick = (item: ActivityListItem) => {
    if (!item.hash) {
      return;
    }

    trackEvent(
      createEventBuilder(MetaMetricsEventName.ActivityDetailsOpened)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          activity_type: item.type,
        })
        .build(),
    );
    setSelectedItem(item);
  };

  const handleClose = () => {
    if (selectedItem) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.ActivityDetailsClosed)
          .addCategory(MetaMetricsEventCategory.Navigation)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            activity_type: selectedItem.type,
          })
          .build(),
      );
    }
    setSelectedItem(null);
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
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
              className="flex h-full min-h-[50vh]"
            >
              <Box className="w-10 h-10">
                <Spinner />
              </Box>
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
        isOpen={Boolean(selectedItem?.hash)}
        chainId={selectedItem?.chainId}
        txIdentifier={selectedItem?.hash}
        onClose={handleClose}
      />
    </PendingTransactionCancelSpeedUpProvider>
  );
}
