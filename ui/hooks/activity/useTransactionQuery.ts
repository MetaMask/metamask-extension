import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { type CaipChainId, hexToNumber } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { convertCaipToHexChainId } from '../../../shared/lib/network.utils';
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
  const numericChainId = useMemo(() => {
    if (!chainId) {
      return undefined;
    }

    try {
      return hexToNumber(convertCaipToHexChainId(chainId as CaipChainId));
    } catch {
      return undefined;
    }
  }, [chainId]);

  const queryOptions = apiClient.accounts.getV1TransactionByHashQueryOptions(
    numericChainId ?? 1,
    txHash ?? '',
    {
      includeLogs: false,
      includeValueTransfers: true,
      includeTxMetadata: true,
      lang: locale.split('-')[0],
    },
  );

  return useQuery({
    ...queryOptions,
    // @ts-expect-error apiClient returns v5 types, repo still in v4
    enabled: enabled && Boolean(numericChainId && txHash),
    retry: false,
    select: (response: unknown) =>
      (response as unknown as { data: V1TransactionByHashResponse }).data,
  });
}
