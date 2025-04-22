import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';

import { useSelector } from 'react-redux';
import { AsyncResult, useAsyncResult } from '../../../../../../hooks/useAsync';
import { decodeTransactionData } from '../../../../../../store/actions';
import { DecodedTransactionDataResponse } from '../../../../../../../shared/types/transaction-decode';
import { useConfirmContext } from '../../../../context/confirm';
import { hasTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import { use4ByteResolutionSelector } from '../../../../../../selectors';

export function useDecodedTransactionData({
  data,
  to,
  transactionTypeFilter,
}: {
  data?: Hex;
  to?: Hex;
  transactionTypeFilter?: string;
} = {}): AsyncResult<DecodedTransactionDataResponse | undefined> {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isDecodeEnabled = useSelector(use4ByteResolutionSelector);

  const currentTransactionType = currentConfirmation?.type;
  const chainId = currentConfirmation?.chainId as Hex;
  const currentTransactionData = currentConfirmation?.txParams?.data as Hex;
  const currentTransactionTo = currentConfirmation?.txParams?.to as Hex;
  const transactionData = data ?? currentTransactionData;
  const transactionTo = to ?? currentTransactionTo;

  return useAsyncResult(async () => {
    if (
      !isDecodeEnabled ||
      !hasTransactionData(transactionData) ||
      !transactionTo ||
      (transactionTypeFilter &&
        currentTransactionType !== transactionTypeFilter)
    ) {
      return undefined;
    }

    return await decodeTransactionData({
      transactionData,
      chainId,
      contractAddress: transactionTo,
    });
  }, [isDecodeEnabled, transactionData, transactionTo, chainId]);
}
