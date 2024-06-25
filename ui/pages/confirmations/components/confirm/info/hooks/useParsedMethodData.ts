import { decodeUniswapRouterTransactionData } from '../../../../../../../shared/modules/transaction-decode/uniswap';
import { Hex } from '@metamask/utils';
import { useAsyncResult } from '../../../../../../hooks/useAsyncResult';
import { decodeTransactionDataWithSourcify } from '../../../../../../../shared/modules/transaction-decode/sourcify';

export type ParsedParam = {
  name?: string;
  description?: string;
  type: string;
  value: any;
};

export type ParsedMethod = {
  name: string;
  params: ParsedParam[];
  description?: string;
};

export type ParsedTransactionData = ParsedMethod[];

export function useParsedMethodData({
  transactionData,
  chainId,
  address,
}: {
  transactionData: Hex;
  chainId: Hex;
  address: Hex;
}): ParsedTransactionData | undefined {
  const unicodeData = decodeUniswapRouterTransactionData(transactionData);

  const sourcifyResult = useAsyncResult(
    () => decodeTransactionDataWithSourcify(transactionData, address, chainId),
    [chainId, address, transactionData],
  );

  const sourcifyData = sourcifyResult.value && [sourcifyResult.value];

  return unicodeData || sourcifyData;
}
