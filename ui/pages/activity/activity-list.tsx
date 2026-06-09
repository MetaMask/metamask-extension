import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
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
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { selectEnabledNetworksAsCaipChainIds } from '../../selectors/multichain/networks';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { LegacyDetails } from './legacy-details';
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
  const { trackEvent } = useContext(MetaMetricsContext);
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

  const networkFilterForMetrics = useSelector(
    selectEnabledNetworksAsCaipChainIds,
  );

  // Latest values for the metric effect, updated each render without triggering it
  const metricsDataRef = useRef({
    groupedItems,
    localItems,
    nonEvmItems,
    networkFilterForMetrics,
  });
  metricsDataRef.current = {
    groupedItems,
    localItems,
    nonEvmItems,
    networkFilterForMetrics,
  };

  const hasTrackedScreenOpenedRef = useRef(false);

  // Fire ActivityScreenOpened once the list has settled — same condition the
  // VirtualizedList uses to choose between loading state and empty state.
  // Guarded by `!filter` so it never fires on asset detail pages.
  useEffect(() => {
    if (
      filter ||
      networks === null ||
      isInitialLoading ||
      hasTrackedScreenOpenedRef.current
    ) {
      return;
    }
    hasTrackedScreenOpenedRef.current = true;

    const {
      groupedItems: grouped,
      localItems: local,
      nonEvmItems: nonEvm,
      networkFilterForMetrics: networkFilter,
    } = metricsDataRef.current;

    trackEvent({
      category: MetaMetricsEventCategory.Home,
      event: MetaMetricsEventName.ActivityScreenOpened,
      properties: {
        /* eslint-disable @typescript-eslint/naming-convention */
        network_filter: networkFilter,
        is_empty: grouped.length === 0,
        pending_transactions: [...local, ...nonEvm].filter(
          (item) => item.status === 'pending',
        ).length,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    });
  }, [filter, isInitialLoading, networks, trackEvent]);

  const itemRef = useItemInView({
    targetIndex: lastEvmItemIndex,
    root: scrollContainerRef?.current ?? null,
    onVisible: fetchNextVisiblePage,
  });

  const handleClick = (item: ActivityListItem) => {
    trackEvent({
      event: MetaMetricsEventName.ActivityDetailsOpened,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        activity_type: item.type,
      },
    });
    setSelectedItem(item);
  };

  const handleClose = () => {
    if (selectedItem) {
      trackEvent({
        event: MetaMetricsEventName.ActivityDetailsClosed,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          activity_type: selectedItem.type,
        },
      });
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

      <LegacyDetails item={selectedItem} onClose={handleClose} />
    </PendingTransactionCancelSpeedUpProvider>
  );
}
