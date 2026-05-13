import React, { useMemo } from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '@metamask/design-system-react';
import { NETWORK_TO_NAME_MAP } from '../../../shared/constants/network';
import type { ActivityListItem as ActivityListItemModel } from '../../../shared/lib/activity/types';
import { convertCaipToHexChainId } from '../../../shared/lib/network.utils';
import { VirtualizedList } from '../../components/ui/virtualized-list/virtualized-list';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getImageForChainId } from '../../selectors/multichain';
import { useGetLabel } from './useGetLabel';
import { useTransactionQuery } from './useTransactionQuery';

const activityItemHeight = 72;

const ListItem = ({ activity }: { activity: ActivityListItemModel }) => {
  const { description, title } = useGetLabel(activity);
  const chainId = convertCaipToHexChainId(activity.chainId);

  return (
    <Box className="px-4 py-3 border-b border-border-muted">
      <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-4">
        <AvatarNetwork
          size={AvatarNetworkSize.Sm}
          name={
            NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ??
            activity.chainId
          }
          src={getImageForChainId(chainId)}
        />
        <div className="min-w-0">
          <Text className="font-medium truncate">{title}</Text>
          {description ? (
            <Text variant="body-sm" className="text-alternative truncate">
              {description}
            </Text>
          ) : null}
        </div>
        <Text className="text-sm text-alternative text-right whitespace-nowrap">
          {activity.type}
        </Text>
      </div>
    </Box>
  );
};

function getActivityKey(activity: ActivityListItemModel, index: number) {
  return `${activity.chainId}:${activity.timestamp}:${activity.type}:${index}`;
}

export function ActivityList() {
  const t = useI18nContext();
  const {
    data,
    isInitialLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionQuery();

  const activities = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  if (isInitialLoading) {
    return (
      <Box className="p-4">
        <Text>{t('loading')}</Text>
      </Box>
    );
  }

  return (
    <VirtualizedList
      data={activities}
      estimatedItemSize={activityItemHeight}
      keyExtractor={getActivityKey}
      renderItem={({ item }) => <ListItem activity={item} />}
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
  );
}
