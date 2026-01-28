import { useInfiniteQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { fetchV4MultiAccountTransactions } from '../helpers/api-client';
import { getSelectedAccountIds } from '../selectors/accounts';
import { getAllEnabledNetworksInCaipFormat } from '../selectors/multichain/networks';
import { filterTransactions } from '../helpers/transaction-filtering-logic';

export function useActivityQuery() {
  const accountIds = useSelector(getSelectedAccountIds);
  const networks = useSelector(getAllEnabledNetworksInCaipFormat);

  // This is filtering that should done server side
  const selectFilter = useMemo(
    () => filterTransactions(accountIds),
    [accountIds],
  );

  return useInfiniteQuery(
    ['activity-list', accountIds, networks],
    ({ pageParam }) =>
      fetchV4MultiAccountTransactions({
        accountIds,
        cursor: pageParam,
        networks,
      }),
    {
      enabled: accountIds.length > 0,
      getNextPageParam: ({ pageInfo }) =>
        pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
      select: selectFilter,
    },
  );
}
