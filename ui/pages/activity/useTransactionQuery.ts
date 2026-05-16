import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MINUTE } from '../../../shared/constants/time';
import { getIntlLocale } from '../../ducks/locale/locale';
import { apiClient } from '../../helpers/api-client';
import { getUseExternalServices } from '../../selectors';
import { selectEvmAddress } from '../../selectors/accounts';
import { useClientFilters } from './filters/useClientFilters';

export function useTransactionQuery({ networks }: { networks: string[] }) {
  const useExternalServices = useSelector(getUseExternalServices);
  const evmAddress = (useSelector(selectEvmAddress) || '').toLowerCase();
  const locale = useSelector(getIntlLocale);
  const selectFn = useClientFilters(evmAddress);

  const accountAddresses = useMemo(
    () => (evmAddress ? [`eip155:0:${evmAddress}`] : []),
    [evmAddress],
  );

  const queryOptions =
    apiClient.accounts.getV4MultiAccountTransactionsInfiniteQueryOptions({
      accountAddresses,
      networks,
      includeTxMetadata: true,
      lang: locale.split('-')[0],
    });

  const enabled =
    Boolean(useExternalServices) &&
    networks.length > 0 &&
    accountAddresses.length > 0;

  // @ts-expect-error apiClient returns v5 types, repo still in v4
  return useInfiniteQuery({
    ...queryOptions,
    select: selectFn,
    enabled,
    retry: false,
    keepPreviousData: true,
    staleTime: 5 * MINUTE,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
