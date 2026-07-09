import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '@metamask/core-backend';
import type { CaipChainId } from '@metamask/utils';
import { getErrorBodyMessage } from '../../../../shared/lib/error';
import { selectTransactions } from '../../../../shared/lib/multichain/transformations';
import { MINUTE } from '../../../../shared/constants/time';
import { NON_EVM_ACTIVITY_FROM_API } from '../../../../shared/constants/non-evm-activity-offload';
import { getUseExternalServices } from '../../../selectors';
import { selectEvmAddress } from '../../../selectors/accounts';
import { selectSelectedAccountGroupNonEvmAccounts } from '../../../selectors/multichain-transactions';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { apiClient } from '../../../helpers/api-client';
import { selectEnabledNetworksAsCaipChainIds } from '../../../selectors/multichain/networks';
import { selectRequiredTransactionHashes } from '../../../selectors/transactionController';
import type { ActivityListFilter } from './helpers';

const SUPPORTED_NON_EVM_SCOPES = ['eip155', 'tron'];

const knownApiMessages = ['networks param contains no supported chains'];

type TransactionsQueryOptions = ReturnType<
  typeof apiClient.accounts.getV4MultiAccountTransactionsInfiniteQueryOptions
>;
type TransactionsQueryFunction = Extract<
  NonNullable<TransactionsQueryOptions['queryFn']>,
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

function withKnownApiResponse(queryFn: TransactionsQueryOptions['queryFn']) {
  if (typeof queryFn !== 'function') {
    return queryFn;
  }

  return async (context: Parameters<TransactionsQueryFunction>[0]) => {
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

function getTransactionApiLanguage(locale: string) {
  return locale.split('-')[0];
}

function useTransactionParams(caipChainId?: CaipChainId) {
  const evmAddress = (useSelector(selectEvmAddress) || '').toLowerCase();
  const locale = useSelector(getIntlLocale);
  const enabledNetworks = useSelector(selectEnabledNetworksAsCaipChainIds);
  // The selected internal account is usually the group's EVM account, so read the
  // whole account group (same SRP) to find its non-EVM account(s).
  const groupNonEvmAccounts = useSelector(
    selectSelectedAccountGroupNonEvmAccounts,
  );

  const supportedNonEvmAccounts = useMemo(
    () =>
      groupNonEvmAccounts.filter((account) =>
        SUPPORTED_NON_EVM_SCOPES.some((scope) =>
          account.accountApiAddress.startsWith(`${scope}:`),
        ),
      ),
    [groupNonEvmAccounts],
  );

  const nonEvmAccounts = useMemo(
    () => (NON_EVM_ACTIVITY_FROM_API ? supportedNonEvmAccounts : []),
    [supportedNonEvmAccounts],
  );

  const networks = useMemo(() => {
    // With the offload on, request all enabled networks (EVM + non-EVM);
    // otherwise EVM only.
    const includeNetwork = (id: string) =>
      id.startsWith('eip155:') ||
      (NON_EVM_ACTIVITY_FROM_API &&
        SUPPORTED_NON_EVM_SCOPES.some((scope) => id.startsWith(`${scope}:`)));

    if (caipChainId) {
      return includeNetwork(caipChainId) ? [caipChainId] : [];
    }
    return enabledNetworks.filter(includeNetwork);
  }, [enabledNetworks, caipChainId]);

  const accountAddresses = useMemo(() => {
    const addresses: string[] = [];
    if (evmAddress) {
      addresses.push(`eip155:0:${evmAddress}`);
    }
    nonEvmAccounts.forEach((account) =>
      addresses.push(account.accountApiAddress),
    );
    return addresses;
  }, [evmAddress, nonEvmAccounts]);

  // Addresses used to filter the response to the selected group (both EVM and
  // non-EVM), lowercased so base58/bech32 addresses compare consistently.
  const filterAddresses = useMemo(
    () =>
      [
        evmAddress,
        ...nonEvmAccounts.map((account) => account.address.toLowerCase()),
      ].filter(Boolean),
    [evmAddress, nonEvmAccounts],
  );

  console.log({ evmAddress, filterAddresses, accountAddresses, networks });

  return useMemo(
    () => ({
      evmAddress,
      filterAddresses,
      accountAddresses,
      lang: getTransactionApiLanguage(locale),
      networks,
    }),
    [evmAddress, filterAddresses, accountAddresses, locale, networks],
  );
}

export function useTransactionsQuery(filter?: ActivityListFilter) {
  console.log('useTransactionsQuery', { filter });
  const useExternalServices = useSelector(getUseExternalServices);
  const { evmAddress, filterAddresses, accountAddresses, lang, networks } =
    useTransactionParams(filter?.chainId);
  const internalTxHashes = useSelector(selectRequiredTransactionHashes);

  const selectFn = useMemo(
    () =>
      selectTransactions({
        address: evmAddress,
        addresses: filterAddresses,
        excludedTxHashes: internalTxHashes,
      }),
    [evmAddress, filterAddresses, internalTxHashes],
  );

  const queryOptions =
    apiClient.accounts.getV4MultiAccountTransactionsInfiniteQueryOptions({
      accountAddresses,
      networks,
      includeTxMetadata: true,
      lang,
    });

  console.log('useTransactionsQuery', {
    useExternalServices,
    networks,
    accountAddresses,
    queryOptions,
  });

  return useInfiniteQuery({
    ...queryOptions,
    // @ts-expect-error apiClient returns v5 types, repo still in v4
    queryFn: withKnownApiResponse(queryOptions.queryFn),
    select: selectFn,
    enabled:
      Boolean(useExternalServices) &&
      networks.length > 0 &&
      accountAddresses.length > 0,
    retry: false,
    keepPreviousData: true,
    staleTime: 5 * MINUTE,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function usePrefetchTransactions() {
  const queryClient = useQueryClient();
  const useExternalServices = useSelector(getUseExternalServices);
  const { evmAddress, accountAddresses, lang, networks } =
    useTransactionParams();

  const queryOptions = useMemo(
    () =>
      apiClient.accounts.getV4MultiAccountTransactionsInfiniteQueryOptions({
        accountAddresses,
        networks,
        includeTxMetadata: true,
        lang,
      }),
    [accountAddresses, lang, networks],
  );

  return useCallback(() => {
    if (!useExternalServices || !evmAddress) {
      return;
    }

    const { queryKey } = queryOptions;
    if (!queryKey || queryClient.getQueryData(queryKey)) {
      return;
    }

    if (queryClient.isFetching({ queryKey }) > 0) {
      return;
    }

    queryClient
      .prefetchInfiniteQuery({
        ...queryOptions,
        // @ts-expect-error apiClient returns v5 types, repo still in v4
        queryFn: withKnownApiResponse(queryOptions.queryFn),
        retry: false,
        staleTime: 5 * MINUTE,
      })
      .catch(() => {
        // Prefetch is opportunistic
      });
  }, [evmAddress, queryOptions, queryClient, useExternalServices]);
}
