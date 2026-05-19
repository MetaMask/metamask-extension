import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Text } from '@metamask/design-system-react';
import { VirtualizedList } from '../../components/ui/virtualized-list/virtualized-list';
import { useScrollContainer } from '../../contexts/scroll-container';
import { formatDateWithYearContext } from '../../helpers/utils/util';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useI18nContext } from '../../hooks/useI18nContext';
import { selectEnabledNetworksAsCaipChainIds } from '../../selectors/multichain/networks';
import { ListItem } from './cells/list-item';
import { dedupeItems, getItemKey, groupItemsByDate } from './helpers';
import { useLocalTransactions } from './useLocalTransactions';
import { useNonEvmTransactions } from './useNonEvmTransactions';
import { useTransactionsQuery } from './useTransactionsQuery';

const itemHeight = 72;
const evmPaginationRootMargin = '300px 0px';

// Prototype implementation for the new activity list
export function ActivityList() {
  const t = useI18nContext();
  const scrollContainerRef = useScrollContainer();
  const allNetworks = useSelector(selectEnabledNetworksAsCaipChainIds);
  const [selectedNetwork, setSelectedNetwork] = useState('');
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
    const grouped = groupItemsByDate(
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

  const { ref: lastEvmItemRef } = useIntersectionObserver({
    root: scrollContainerRef?.current ?? null,
    rootMargin: evmPaginationRootMargin,
    onChange: (isIntersecting) => {
      if (isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const lastObservedEvmItemRef = useRef<HTMLDivElement | null>(null);
  const observeLastEvmItem = useCallback(
    (node: HTMLDivElement | null, { index }: { index: number }) => {
      if (index === lastEvmItemIndex) {
        lastObservedEvmItemRef.current = node;
        lastEvmItemRef(node);
      } else if (node && lastObservedEvmItemRef.current === node) {
        lastObservedEvmItemRef.current = null;
        lastEvmItemRef(null);
      }
    },
    [lastEvmItemIndex, lastEvmItemRef],
  );

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
        itemRef={observeLastEvmItem}
        renderItem={({ item: row }) =>
          row.type === 'date-header' ? (
            <Box className="px-4 py-2 bg-background-default">
              <Text className="text-sm text-alternative">
                {formatDateWithYearContext(row.date, 'MMM d, y', 'MMM d, y')}
              </Text>
            </Box>
          ) : (
            <ListItem data={row.item} />
          )
        }
        listFooterComponent={
          isFetchingNextPage ? (
            <Box className="p-4 flex justify-center">
              <Text className="text-alternative">{t('loading')}</Text>
            </Box>
          ) : null
        }
      />
    </>
  );
}
