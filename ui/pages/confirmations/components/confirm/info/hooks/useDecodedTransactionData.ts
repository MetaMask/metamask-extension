import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';

import { hasTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import type { DecodedTransactionDataResponse } from '../../../../../../../shared/types/transaction-decode';
import type { AsyncResult } from '../../../../../../hooks/useAsync';
import { useAsyncResult } from '../../../../../../hooks/useAsync';
import { use4ByteResolutionSelector } from '../../../../../../selectors';
import { decodeTransactionData } from '../../../../../../store/actions';
import { useConfirmContext } from '../../../../context/confirm';

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
  const chainId = currentConfirmation?.chainId;
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
