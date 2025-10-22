import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';

import { useMemo } from 'react';
import { DecodedTransactionDataResponse } from '../../shared/types';
import { hasTransactionData } from '../../shared/modules/transaction.utils';
import { decodeTransactionData } from '../store/actions';
import { AsyncResult, useAsyncResult } from './useAsync';

export function useDecodedTransactionData({
  data,
  to,
  chainId,
}: {
  data?: Hex;
  to?: Hex;
  chainId?: Hex;
} = {}): AsyncResult<DecodedTransactionDataResponse | undefined> {
  return useAsyncResult(async () => {
    if (!data || !hasTransactionData(data) || !to || !chainId) {
      return undefined;
    }

    return await decodeTransactionData({
      transactionData: data,
      chainId,
      contractAddress: to,
    });
  }, [data, to, chainId]);
}

export function useDecodedTransactionDataValue(
  transactionMeta?: TransactionMeta,
) {
  const decodeResponse = useDecodedTransactionData({
    data: transactionMeta?.txParams?.data as Hex,
    to: transactionMeta?.txParams?.to as Hex,
    chainId: transactionMeta?.chainId as Hex,
  });
  const value = useMemo(
    () =>
      decodeResponse?.value?.data[0]?.params?.find(
        (param) => param.name === 'value' || param.name === 'amount',
      )?.value,
    [decodeResponse],
  );

  return { decodeResponse, value };
}
