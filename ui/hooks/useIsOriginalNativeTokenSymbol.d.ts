import { CaipChainId } from '@metamask/utils';

declare function useIsOriginalNativeTokenSymbol(
  chainId: CaipChainId | string | number,
  ticker: string,
  type: string,
  rpcUrl?: string | null,
): boolean;