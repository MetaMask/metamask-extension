import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Text } from '@metamask/design-system-react';
import { VirtualizedList } from '../../components/ui/virtualized-list/virtualized-list';
import { formatDateWithYearContext } from '../../helpers/utils/util';
import { useI18nContext } from '../../hooks/useI18nContext';
import { selectEnabledEvmNetworksAsCaipChainIds } from '../../selectors/multichain/networks';
import { ListItem } from './cells/ListItem';
import { useTransactionQuery } from './useTransactionQuery';

const activityItemHeight = 72;

function parseDate(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function ActivityList() {
  const t = useI18nContext();
  const enabledEvmNetworks = useSelector(
    selectEnabledEvmNetworksAsCaipChainIds,
  );
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const networks = selectedNetwork ? [selectedNetwork] : enabledEvmNetworks;

  const {
    data,
    isInitialLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionQuery({ networks });

  const activities = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const groupedActivities = useMemo(() => {
    let currentDate: number | null = null;

    return activities.flatMap((activity) => {
      const date = parseDate(activity.timestamp);

      if (date === currentDate) {
        return [{ type: 'activity' as const, activity }];
      }

      currentDate = date;
      return [
        { type: 'date-header' as const, date },
        { type: 'activity' as const, activity },
      ];
    });
  }, [activities]);

  if (isInitialLoading) {
    return (
      <Box className="p-4">
        <Text>{t('loading')}</Text>
      </Box>
    );
  }

  return (
    <>
      <Box className="p-3 border-b border-border-muted">
        <select
          className="rounded border border-border-muted bg-background-default text-sm"
          value={selectedNetwork}
          onChange={(event) => {
            setSelectedNetwork(event.target.value);
          }}
        >
          <option value="">All networks</option>
          {enabledEvmNetworks.map((network) => (
            <option key={network} value={network}>
              {network}
            </option>
          ))}
        </select>
      </Box>
      <VirtualizedList
        data={groupedActivities}
        estimatedItemSize={activityItemHeight}
        keyExtractor={(item, index) =>
          item.type === 'date-header'
            ? `date-header:${item.date}`
            : `${item.activity.chainId}:${item.activity.timestamp}:${item.activity.type}:${index}`
        }
        renderItem={({ item }) =>
          item.type === 'date-header' ? (
            <Box className="px-4 py-2 bg-background-default">
              <Text className="text-sm text-alternative">
                {formatDateWithYearContext(item.date, 'MMM d, y', 'MMM d, y')}
              </Text>
            </Box>
          ) : (
            <ListItem data={item.activity} />
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
