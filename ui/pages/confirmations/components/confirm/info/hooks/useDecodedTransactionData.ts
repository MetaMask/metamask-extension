import { decodeUniswapRouterTransactionData } from '../../../../../../../shared/modules/transaction-decode/uniswap';
import { Hex } from '@metamask/utils';
import { useAsyncResult } from '../../../../../../hooks/useAsyncResult';
import { decodeTransactionDataWithSourcify } from '../../../../../../../shared/modules/transaction-decode/sourcify';
import { DecodedTransactionMethod } from '../../../../../../../shared/modules/transaction-decode/types';
import { useFourByte } from './useFourByte';
import { decodeTransactionDataWithFourByte } from '../../../../../../../shared/modules/transaction-decode/four-byte';

export function useDecodedTransactionData({
  transactionData,
  chainId,
  address,
}: {
  transactionData: Hex;
  chainId: Hex;
  address: Hex;
}): DecodedTransactionMethod[] | undefined {
  const uniswapData = decodeUniswapRouterTransactionData(transactionData);

  const sourcifyResult = useAsyncResult(
    () => decodeTransactionDataWithSourcify(transactionData, address, chainId),
    [chainId, address, transactionData],
  );

  const fourByteResponse = useFourByte({ transactionData });

  const sourcifyData = sourcifyResult.value && [sourcifyResult.value];

  const fourByteData = fourByteResponse && [
    decodeTransactionDataWithFourByte(fourByteResponse, transactionData),
  ];

  return uniswapData ?? sourcifyData ?? fourByteData;
}
