import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Text } from '@metamask/design-system-react';
import { SectionHeader } from '../../components/ui/section-header';
import { VirtualizedList } from '../../components/ui/virtualized-list/virtualized-list';
import { useScrollContainer } from '../../contexts/scroll-container';
import { formatDateWithYearContext } from '../../helpers/utils/util';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useItemInView } from '../../hooks/useItemInView';
import { selectEnabledNetworksAsCaipChainIds } from '../../selectors/multichain/networks';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { LegacyDetails } from './legacy-details';
import { ListItem } from './cells/list-item';
import { dedupeItems, getItemKey, groupActivityListItems } from './helpers';
import { useLocalTransactions } from './useLocalTransactions';
import { useNonEvmTransactions } from './useNonEvmTransactions';
import { useTransactionsQuery } from './useTransactionsQuery';

const itemHeight = 70;

// Prototype implementation for the new activity list
export function ActivityList() {
  const t = useI18nContext();
  const scrollContainerRef = useScrollContainer();
  const allNetworks = useSelector(selectEnabledNetworksAsCaipChainIds);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedItem, setSelectedItem] = useState<ActivityListItem | null>(
    null,
  );
  const networks = useMemo(
    () => (selectedNetwork ? [selectedNetwork] : allNetworks),
    [selectedNetwork, allNetworks],
  );
  const localItems = useLocalTransactions({ networks });
  const nonEvmItems = useNonEvmTransactions({ networks });

  const {
    data,
    isInitialLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionsQuery({ networks });

  const { groupedItems, lastEvmItemIndex } = useMemo(() => {
    const evmItems = data?.pages.flatMap((page) => page.data) ?? [];
    const evmItemHashes = new Set(
      evmItems.flatMap((item) => {
        const hash = item.data.hash?.toLowerCase();
        return hash ? [hash] : [];
      }),
    );
    const grouped = groupActivityListItems(
      dedupeItems(evmItems, nonEvmItems, localItems),
    );

    for (let index = grouped.length - 1; index >= 0; index -= 1) {
      const row = grouped[index];
      const hash =
        row?.type === 'item' ? row.item.data.hash?.toLowerCase() : undefined;

      if (hash && evmItemHashes.has(hash)) {
        return { groupedItems: grouped, lastEvmItemIndex: index };
      }
    }

    return { groupedItems: grouped, lastEvmItemIndex: -1 };
  }, [data, localItems, nonEvmItems]);

  const itemRef = useItemInView({
    targetIndex: lastEvmItemIndex,
    root: scrollContainerRef?.current ?? null,
    onVisible: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const handleClick = (item: ActivityListItem) => {
    setSelectedItem(item);
  };

  if (isInitialLoading) {
    return (
      <Box className="p-4">
        <Text>{t('loading')}</Text>
      </Box>
    );
  }

  return (
    <>
      <Box className="p-3">
        <select
          className="rounded border border-border-muted bg-background-default text-sm"
          value={selectedNetwork}
          onChange={(event) => {
            setSelectedNetwork(event.target.value);
          }}
        >
          <option value="">All networks</option>
          {allNetworks.map((network) => (
            <option key={network} value={network}>
              {network}
            </option>
          ))}
        </select>
      </Box>

      <VirtualizedList
        data={groupedItems}
        estimatedItemSize={itemHeight}
        keyExtractor={getItemKey}
        itemRef={itemRef}
        renderItem={({ item: row }) => {
          if (row.type === 'pending-header') {
            return <SectionHeader label={t('pending')} />;
          }

          if (row.type === 'date-header') {
            return (
              <SectionHeader
                label={formatDateWithYearContext(
                  row.date,
                  'MMM d, y',
                  'MMM d, y',
                )}
              />
            );
          }

          return (
            <ListItem data={row.item} onClick={() => handleClick(row.item)} />
          );
        }}
        listFooterComponent={
          isFetchingNextPage ? (
            <Box className="p-4 flex justify-center">
              <Text className="text-alternative">{t('loading')}</Text>
            </Box>
          ) : null
        }
      />

      <LegacyDetails
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
