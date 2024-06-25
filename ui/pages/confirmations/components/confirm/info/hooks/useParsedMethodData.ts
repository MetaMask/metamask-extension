import { decodeUniswapRouterTransactionData } from '../../../../../../../shared/modules/transaction-decode/uniswap';
import { Hex } from '@metamask/utils';

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
  chainId,
  address,
  data,
}: {
  data: string;
  chainId: string;
  address: string;
}): ParsedTransactionData | undefined {
  return decodeUniswapRouterTransactionData(data as Hex);
}
