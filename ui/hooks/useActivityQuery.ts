import { useInfiniteQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { fetchV4MultiAccountTransactions } from '../helpers/api-client';
import { getSelectedInternalAccount } from '../selectors/accounts';
import { filterTransactions } from '../helpers/transaction-filtering-logic';

export function useActivityQuery() {
  const accountAddress = useSelector(getSelectedInternalAccount)?.address;

  // This is filtering that should done server side
  const selectFilter = useMemo(
    () => filterTransactions(accountAddress),
    [accountAddress],
  );

  return useInfiniteQuery({
    queryKey: ['activity-list', accountAddress],
    queryFn: ({ pageParam }) =>
      fetchV4MultiAccountTransactions({
        accountAddresses: accountAddress ? [accountAddress] : [],
        cursor: pageParam,
      }),
    enabled: Boolean(accountAddress),
    getNextPageParam: ({ pageInfo }) =>
      pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
    select: selectFilter,
  });
}
