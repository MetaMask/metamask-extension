import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Text } from '@metamask/design-system-react';
import { VirtualizedList } from '../../components/ui/virtualized-list/virtualized-list';
import { formatDateWithYearContext } from '../../helpers/utils/util';
import { useI18nContext } from '../../hooks/useI18nContext';
import { selectEnabledNetworksAsCaipChainIds } from '../../selectors/multichain/networks';
import { ListItem } from './cells/list-item';
import { dedupeItems, getItemKey, groupItemsByDate } from './helpers';
import { useLocalTransactions } from './useLocalTransactions';
import { useNonEvmTransactions } from './useNonEvmTransactions';
import { useTransactionsQuery } from './useTransactionsQuery';

const itemHeight = 72;

// Prototype implementation for the new activity list
export function ActivityList() {
  const t = useI18nContext();
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

  const groupedItems = useMemo(() => {
    const evmItems = data?.pages.flatMap((page) => page.data) ?? [];

    return groupItemsByDate(dedupeItems(evmItems, nonEvmItems, localItems));
  }, [data, localItems, nonEvmItems]);

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
          hasNextPage ? (
            <Box className="p-4 flex justify-center">
              <button
                type="button"
                className="text-primary-default"
                disabled={isFetchingNextPage}
                onClick={() => {
                  fetchNextPage();
                }}
              >
                {isFetchingNextPage ? t('loading') : t('showMore')}
              </button>
            </Box>
          ) : null
        }
      />
    </>
  );
}
