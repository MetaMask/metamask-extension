import { CaipChainId } from '@metamask/utils';

export type AggregatorNetwork = {
  active: boolean;
  chainId: number | CaipChainId;
  chainName: string;
  nativeTokenSupported: boolean;
  shortName: string;
};
