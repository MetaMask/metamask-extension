import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';

import { useSelector } from 'react-redux';
import {
  AsyncResult,
  useAsyncResult,
} from '../../../../../../hooks/useAsyncResult';
import { decodeTransactionData } from '../../../../../../store/actions';
import { DecodedTransactionDataResponse } from '../../../../../../../shared/types/transaction-decode';
import { hasTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import { use4ByteResolutionSelector } from '../../../../../../selectors';

export function useDecodedTransactionData({
  chainId,
  transactionData,
  transactionTo,
  transactionTypeFilter,
  transactionType,
}: {
  chainId: Hex;
  transactionData?: Hex;
  transactionTo?: Hex;
  transactionTypeFilter?: TransactionMeta['type'];
  transactionType?: TransactionType;
}): AsyncResult<DecodedTransactionDataResponse | undefined> {
  const isDecodeEnabled = useSelector(use4ByteResolutionSelector);

  return useAsyncResult(async () => {
    if (
      !isDecodeEnabled ||
      !hasTransactionData(transactionData) ||
      !transactionTo ||
      (transactionTypeFilter && transactionType !== transactionTypeFilter)
    ) {
      return undefined;
    }

    return await decodeTransactionData({
      transactionData: transactionData as Hex,
      chainId,
      contractAddress: transactionTo,
    });
  }, [isDecodeEnabled, transactionData, transactionTo, chainId]);
}
