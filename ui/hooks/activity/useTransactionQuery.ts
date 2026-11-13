import { useMemo } from 'react';
import { skipToken, useQuery } from '@tanstack/react-query';
import type { V5TransactionRecord } from '@metamask/core-backend';
import {
  isCaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
  toCaipAccountId,
} from '@metamask/utils';
import { useSelector } from 'react-redux';
import { selectEvmAddress } from '#ui/selectors/activity';
import { getIntlLocale } from '../../ducks/locale/locale';
import { apiClient } from '../../helpers/api-client';

export function useTransactionQuery({
  chainId,
  enabled,
  txHash,
}: {
  chainId: string | undefined;
  enabled: boolean;
  txHash: string | undefined;
}) {
  const locale = useSelector(getIntlLocale);
  const selectedAddress = useSelector(selectEvmAddress);

  const accountId = useMemo(() => {
    if (!chainId || !selectedAddress || !isCaipChainId(chainId)) {
      return undefined;
    }
    const { reference } = parseCaipChainId(chainId);
    return toCaipAccountId(
      KnownCaipNamespace.Eip155,
      reference,
      selectedAddress.toLowerCase(),
    );
  }, [chainId, selectedAddress]);

  const queryOptions = apiClient.accounts.getV5TransactionByIdQueryOptions(
    accountId ?? toCaipAccountId(KnownCaipNamespace.Eip155, '0', '0x0'),
    txHash ?? '',
    {
      includeLogs: false,
      includeMiscOperations: false,
      includeTxMetadata: true,
      lang: locale.split('-')[0],
    },
  );

  return useQuery({
    ...queryOptions,
    queryFn: enabled && accountId && txHash ? queryOptions.queryFn : skipToken,
    enabled: enabled && Boolean(accountId && txHash),
    retry: false,
    select: (response): V5TransactionRecord => response.data,
  });
}
