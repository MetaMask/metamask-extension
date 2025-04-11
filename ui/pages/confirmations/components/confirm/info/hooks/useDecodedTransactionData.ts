import type { Hex } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';

import { useSelector } from 'react-redux';
import type { AsyncResult} from '../../../../../../hooks/useAsync';
import { useAsyncResult } from '../../../../../../hooks/useAsync';
import { decodeTransactionData } from '../../../../../../store/actions';
import type { DecodedTransactionDataResponse } from '../../../../../../../shared/types/transaction-decode';
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
