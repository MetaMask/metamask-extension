import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import type {
  V1TransactionByHashResponse,
  V4MultiAccountTransactionsResponse,
} from '@metamask/core-backend';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { NATIVE_TOKEN_ADDRESS } from '../../../shared/constants/transaction';
import { MINUTE } from '../../../shared/constants/time';
import { mapMultiAccountTransaction } from '../../../shared/lib/activity/adapters/multiaccount-transaction';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { parseValueTransfers } from '../../../shared/lib/multichain/transformations';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import { getIntlLocale } from '../../ducks/locale/locale';
import { apiClient } from '../../helpers/api-client';
import { getUseExternalServices } from '../../selectors';
import { selectEvmAddress } from '../../selectors/accounts';
import { selectEnabledNetworksAsCaipChainIds } from '../../selectors/multichain/networks';
import { selectRequiredTransactionHashes } from '../../selectors/transactionController';

type ActivityTransactionsResponse = Omit<
  V4MultiAccountTransactionsResponse,
  'data'
> & {
  data: ActivityListItem[];
};

function isSpamTransaction(transaction: V1TransactionByHashResponse) {
  return (
    transaction.transactionProtocol === 'SPAM_TOKEN' ||
    transaction.transactionType === 'SPAM_TOKEN_TRANSFER'
  );
}

function isAccountTransaction(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  return (
    isEqualCaseInsensitive(transaction.from, subjectAddress) ||
    isEqualCaseInsensitive(transaction.to, subjectAddress)
  );
}

function isZeroValueSelfSend(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  return (
    isEqualCaseInsensitive(transaction.from, subjectAddress) &&
    isEqualCaseInsensitive(transaction.to, subjectAddress) &&
    transaction.value === '0' &&
    !transaction.valueTransfers?.length &&
    (!transaction.methodId || transaction.methodId === '0x')
  );
}

function isIncomingTokenTransfer(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  const valueTransfer = transaction.valueTransfers?.find(
    ({ contractAddress, from, to }) =>
      contractAddress &&
      (isEqualCaseInsensitive(to, subjectAddress) ||
        isEqualCaseInsensitive(from, subjectAddress)),
  );

  return (
    valueTransfer &&
    isEqualCaseInsensitive(valueTransfer.to, subjectAddress) &&
    !isEqualCaseInsensitive(transaction.from, subjectAddress)
  );
}

function isIncomingNativeTransfer(
  transaction: V1TransactionByHashResponse,
  subjectAddress: string,
) {
  const amounts = parseValueTransfers(subjectAddress, transaction);

  return (
    !isEqualCaseInsensitive(transaction.from, subjectAddress) &&
    amounts.to?.token.address === NATIVE_TOKEN_ADDRESS &&
    !amounts.from
  );
}

function isIncludedTransaction({
  excludedTxHashes,
  subjectAddress,
  transaction,
}: {
  excludedTxHashes?: Set<string>;
  subjectAddress: string;
  transaction: V1TransactionByHashResponse;
}) {
  if (!isAccountTransaction(transaction, subjectAddress)) {
    return false;
  }

  if (
    transaction.hash &&
    excludedTxHashes?.has(transaction.hash.toLowerCase())
  ) {
    return false;
  }

  if (isSpamTransaction(transaction)) {
    return false;
  }

  if (isZeroValueSelfSend(transaction, subjectAddress)) {
    return false;
  }

  if (isIncomingTokenTransfer(transaction, subjectAddress)) {
    return false;
  }

  if (isIncomingNativeTransfer(transaction, subjectAddress)) {
    return false;
  }

  return true;
}

function transformTransactions({
  excludedTxHashes,
  subjectAddress,
}: {
  excludedTxHashes?: Set<string>;
  subjectAddress: string;
}) {
  return (
    data: InfiniteData<V4MultiAccountTransactionsResponse>,
  ): InfiniteData<ActivityTransactionsResponse> => ({
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data
        .filter((transaction) =>
          isIncludedTransaction({
            excludedTxHashes,
            subjectAddress,
            transaction,
          }),
        )
        .map((transaction) =>
          mapMultiAccountTransaction({ subjectAddress, transaction }),
        ),
    })),
  });
}

export function useTransactionQuery() {
  const useExternalServices = useSelector(getUseExternalServices);
  const evmAddress = (useSelector(selectEvmAddress) || '').toLowerCase();
  const locale = useSelector(getIntlLocale);
  const enabledNetworks = useSelector(selectEnabledNetworksAsCaipChainIds);
  const internalTxHashes = useSelector(selectRequiredTransactionHashes);

  const networks = useMemo(
    () => enabledNetworks.filter((id: string) => id.startsWith('eip155:')),
    [enabledNetworks],
  );

  const accountAddresses = useMemo(
    () => (evmAddress ? [`eip155:0:${evmAddress}`] : []),
    [evmAddress],
  );

  const selectFn = useMemo(
    () =>
      transformTransactions({
        excludedTxHashes: internalTxHashes,
        subjectAddress: evmAddress,
      }),
    [evmAddress, internalTxHashes],
  );

  const queryOptions =
    apiClient.accounts.getV4MultiAccountTransactionsInfiniteQueryOptions({
      accountAddresses,
      networks,
      includeTxMetadata: true,
      lang: locale.split('-')[0],
    });

  // @ts-expect-error apiClient returns v5 types, repo still in v4
  return useInfiniteQuery({
    ...queryOptions,
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
