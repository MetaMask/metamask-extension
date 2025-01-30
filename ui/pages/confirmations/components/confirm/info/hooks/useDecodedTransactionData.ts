import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';

import { useSelector } from 'react-redux';
import {
  AsyncResult,
  useAsyncResult,
} from '../../../../../../hooks/useAsyncResult';
import { decodeTransactionData } from '../../../../../../store/actions';
import { DecodedTransactionDataResponse } from '../../../../../../../shared/types/transaction-decode';
import { useConfirmContext } from '../../../../context/confirm';
import { hasTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import { use4ByteResolutionSelector } from '../../../../../../selectors';

export function useDecodedTransactionData({
  chainIdOverride,
  dataOverride,
  transactionTypeFilter,
  toOverride,
}: {
  chainIdOverride?: Hex;
  dataOverride?: Hex;
  transactionTypeFilter?: TransactionMeta['type'];
  toOverride?: Hex;
}): AsyncResult<DecodedTransactionDataResponse | undefined> {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isDecodeEnabled = useSelector(use4ByteResolutionSelector);

  const currentTransactionType = currentConfirmation?.type;
  const chainId = chainIdOverride ?? (currentConfirmation?.chainId as Hex);

  const contractAddress =
    toOverride ?? (currentConfirmation?.txParams?.to as Hex);

  const transactionData =
    dataOverride ?? (currentConfirmation?.txParams?.data as Hex);

  const transactionTo =
    toOverride ?? (currentConfirmation?.txParams?.to as Hex);

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
      contractAddress,
    });
  }, [
    isDecodeEnabled,
    transactionData,
    transactionTo,
    chainId,
    contractAddress,
  ]);
}
