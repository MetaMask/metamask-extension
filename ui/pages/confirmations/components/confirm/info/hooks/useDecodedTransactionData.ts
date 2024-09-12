import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';

import {
  AsyncResult,
  useAsyncResult,
} from '../../../../../../hooks/useAsyncResult';
import { decodeTransactionData } from '../../../../../../store/actions';
import { DecodedTransactionDataResponse } from '../../../../../../../shared/types/transaction-decode';
import { useConfirmContext } from '../../../../context/confirm';

export function useDecodedTransactionData(): AsyncResult<
  DecodedTransactionDataResponse | undefined
> {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const chainId = currentConfirmation?.chainId as Hex;
  const contractAddress = currentConfirmation?.txParams?.to as Hex;
  const transactionData = currentConfirmation?.txParams?.data as Hex;

  return useAsyncResult(async () => {
    if (!transactionData?.length) {
      return undefined;
    }

    return await decodeTransactionData({
      transactionData,
      chainId,
      contractAddress,
    });
  }, [transactionData, chainId, contractAddress]);
}
