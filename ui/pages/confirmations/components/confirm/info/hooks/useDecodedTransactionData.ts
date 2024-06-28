import { Hex } from '@metamask/utils';
import {
  AsyncResult,
  useAsyncResult,
} from '../../../../../../hooks/useAsyncResult';
import { decodeTransactionData } from '../../../../../../store/actions';
import { DecodedTransactionDataResponse } from '../../../../../../../shared/types/transaction-decode';

export function useDecodedTransactionData({
  transactionData,
  chainId,
  contractAddress,
}: {
  transactionData: Hex;
  chainId: Hex;
  contractAddress: Hex;
}): AsyncResult<DecodedTransactionDataResponse | undefined> {
  return useAsyncResult(
    () => decodeTransactionData({ transactionData, chainId, contractAddress }),
    [transactionData, chainId, contractAddress],
  );
}
