import { Hex } from '@metamask/utils';
import { decodeUniswapRouterTransactionData } from '../../../../../../../shared/modules/transaction-decode/uniswap';
import { useAsyncResult } from '../../../../../../hooks/useAsyncResult';
import { decodeTransactionDataWithSourcify } from '../../../../../../../shared/modules/transaction-decode/sourcify';
import { DecodedTransactionMethod } from '../../../../../../../shared/modules/transaction-decode/types';
import { decodeTransactionDataWithFourByte } from '../../../../../../../shared/modules/transaction-decode/four-byte';
import { getContractProxyAddress } from '../../../../../../store/actions';
import { useFourByte } from './useFourByte';

export enum DecodedTransactionDataSource {
  Uniswap = 'uniswap',
  Sourcify = 'sourcify',
  FourByte = 'fourByte',
}

export type DecodedTransactionDataResponse = {
  source?: DecodedTransactionDataSource;
  data?: DecodedTransactionMethod[];
  loading?: boolean;
};

export function useDecodedTransactionData({
  transactionData,
  chainId,
  address,
}: {
  transactionData: Hex;
  chainId: Hex;
  address: Hex;
}): DecodedTransactionDataResponse {
  const proxyAddress = useAsyncResult(
    () => getContractProxyAddress(address),
    [address],
  );

  const finalAddress = proxyAddress.value ?? address;

  const sourcifyResult = useAsyncResult(
    () =>
      decodeTransactionDataWithSourcify(transactionData, finalAddress, chainId),
    [chainId, finalAddress, transactionData],
  );

  const fourByteResponse = useFourByte({ transactionData });

  const uniswapData = decodeUniswapRouterTransactionData(transactionData);

  if (sourcifyResult.pending || proxyAddress.pending) {
    return {
      loading: true,
    };
  }

  if (uniswapData) {
    return {
      source: DecodedTransactionDataSource.Uniswap,
      data: uniswapData,
    };
  }

  if (sourcifyResult.value) {
    return {
      source: DecodedTransactionDataSource.Sourcify,
      data: [sourcifyResult.value],
    };
  }

  if (fourByteResponse) {
    return {
      source: DecodedTransactionDataSource.FourByte,
      data: [
        decodeTransactionDataWithFourByte(fourByteResponse, transactionData),
      ],
    };
  }

  return {};
}
