import type { InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import type {
  V1TransactionByHashResponse,
  V4MultiAccountTransactionsResponse,
} from '@metamask/core-backend';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MINUTE } from '../../../shared/constants/time';
import { mapEvmTransactions } from '../../../shared/lib/activity/adapters/evm-transactions';
import { getIntlLocale } from '../../ducks/locale/locale';
import { apiClient } from '../../helpers/api-client';
import { getUseExternalServices } from '../../selectors';
import { selectEvmAddress } from '../../selectors/accounts';
import { selectRequiredTransactionHashes } from '../../selectors/transactionController';
import { isExcludedTransactionHash } from './filters/excluded-transaction-hash';
import { isIncomingNativeAssetTransfer } from './filters/incoming-native-asset-transfer';
import { isIncomingTokenTransfer } from './filters/incoming-token-transfer';
import { isSpamTransaction } from './filters/spam-transactions';
import { isTopLevelAccountTransaction } from './filters/top-level-account-transaction';
import { isZeroValueSelfSend } from './filters/zero-value-self-send';

function useClientTransformation(subjectAddress: string) {
  const excludedHashes = useSelector(selectRequiredTransactionHashes);

  return useCallback(
    (data: InfiniteData<V4MultiAccountTransactionsResponse>) => {
      // Ideally we'd want to move some of these filters to the backend
      const filters: ((tx: V1TransactionByHashResponse) => boolean)[] = [
        (tx) => isTopLevelAccountTransaction(tx, subjectAddress),
        (tx) => !isSpamTransaction(tx),
        (tx) => !isZeroValueSelfSend(tx, subjectAddress),
        (tx) => !isIncomingTokenTransfer(tx, subjectAddress),
        (tx) => !isIncomingNativeAssetTransfer(tx, subjectAddress),
        (tx) => !isExcludedTransactionHash(tx, excludedHashes),
      ];

      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          data: page.data
            .filter((transaction) =>
              filters.every((filter) => filter(transaction)),
            )
            .map((transaction) =>
              mapEvmTransactions({ subjectAddress, transaction }),
            ),
        })),
      };
    },
    [excludedHashes, subjectAddress],
  );
}

export function useTransactionQuery({ networks }: { networks: string[] }) {
  const useExternalServices = useSelector(getUseExternalServices);
  const evmAddress = (useSelector(selectEvmAddress) || '').toLowerCase();
  const locale = useSelector(getIntlLocale);
  const selectFn = useClientTransformation(evmAddress);

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
