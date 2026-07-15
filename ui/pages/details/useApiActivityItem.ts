import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { mapApiEvmTransactions } from '../../../shared/lib/activity/adapters/api-evm-transactions';
import { useCachedEvmTransaction } from '../../hooks/activity/useCachedEvmTransaction';
import { selectEvmAddress } from '../../selectors/activity';
import { useTransactionQuery } from './useTransactionQuery';

export function useApiActivityItem({
  chainId,
  txHash,
}: {
  chainId: string | undefined;
  txHash: string | undefined;
}) {
  const subjectAddress = useSelector(selectEvmAddress);
  const isEvm = Boolean(chainId?.startsWith('eip155:'));
  const cachedApiTransaction = useCachedEvmTransaction({
    chainId,
    txHash,
  });
  const { data: apiTransaction } = useTransactionQuery({
    chainId,
    txHash,
    enabled: Boolean(
      isEvm && subjectAddress && txHash && !cachedApiTransaction,
    ),
  });

  return useMemo(() => {
    const transaction = (cachedApiTransaction ??
      apiTransaction) as V1TransactionByHashResponse;

    if (!transaction || !subjectAddress) {
      return undefined;
    }

    return mapApiEvmTransactions({
      subjectAddress,
      transaction,
    });
  }, [apiTransaction, cachedApiTransaction, subjectAddress]);
}
