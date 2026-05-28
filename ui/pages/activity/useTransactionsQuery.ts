import { useInfiniteQuery } from '@tanstack/react-query';
import { HttpError } from '@metamask/core-backend';
import { parseCaipAssetType } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MINUTE } from '../../../shared/constants/time';
import { getErrorBodyMessage } from '../../../shared/lib/error';
import { getIntlLocale } from '../../ducks/locale/locale';
import { apiClient } from '../../helpers/api-client';
import { getUseExternalServices } from '../../selectors';
import { selectEvmAddress } from '../../selectors/accounts';
import type { ActivityListFilter } from './helpers';
import { useQueryFilters } from './query-filters/useQueryFilters';

const knownApiMessages = ['networks param contains no supported chains'];

type TransactionQueryOptions = ReturnType<
  typeof apiClient.accounts.getV4MultiAccountTransactionsInfiniteQueryOptions
>;
type TransactionQueryFunction = Extract<
  NonNullable<TransactionQueryOptions['queryFn']>,
  (...args: never[]) => unknown
>;

function isKnownApiResponseError(error: unknown) {
  if (!(error instanceof HttpError) || error.status !== 400) {
    return false;
  }

  const errorBodyMessage = getErrorBodyMessage(error.body);

  return Boolean(
    errorBodyMessage &&
    knownApiMessages.some((message) => errorBodyMessage.includes(message)),
  );
}

function withKnownApiResponse(queryFn: TransactionQueryOptions['queryFn']) {
  if (typeof queryFn !== 'function') {
    return queryFn;
  }

  return async (context: Parameters<TransactionQueryFunction>[0]) => {
    try {
      return await queryFn(context);
    } catch (error) {
      if (isKnownApiResponseError(error)) {
        return {
          data: [],
          pageInfo: {
            count: 0,
            hasNextPage: false,
          },
        };
      }

      throw error;
    }
  };
}

export function useTransactionsQuery(filters: ActivityListFilter) {
  const useExternalServices = useSelector(getUseExternalServices);
  const evmAddress = (useSelector(selectEvmAddress) || '').toLowerCase();
  const locale = useSelector(getIntlLocale);
  const selectFn = useQueryFilters({ subjectAddress: evmAddress, ...filters });
  const networks =
    'assetId' in filters
      ? [parseCaipAssetType(filters.assetId).chainId]
      : filters.networks;
  const evmNetworks = networks.filter((network) =>
    network.startsWith('eip155:'),
  );

  const accountAddresses = useMemo(
    () => (evmAddress ? [`eip155:0:${evmAddress}`] : []),
    [evmAddress],
  );

  const queryOptions =
    apiClient.accounts.getV4MultiAccountTransactionsInfiniteQueryOptions({
      accountAddresses,
      networks: evmNetworks,
      includeTxMetadata: true,
      lang: locale.split('-')[0],
    });

  const enabled =
    Boolean(useExternalServices) &&
    evmNetworks.length > 0 &&
    accountAddresses.length > 0;

  return useInfiniteQuery({
    ...queryOptions,
    // @ts-expect-error apiClient returns v5 types, repo still in v4
    queryFn: withKnownApiResponse(queryOptions.queryFn),
    select: selectFn,
    enabled,
    retry: false,
    keepPreviousData: enabled,
    staleTime: 5 * MINUTE,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
