import type { CaipAssetType, Hex } from '@metamask/utils';

export type SetPayTokenRequest = {
  address: Hex;
  chainId: Hex;
};

export type SetNonEvmPayTokenRequest = {
  /** CAIP-19 asset type of the non-EVM payment token. */
  assetId: CaipAssetType;

  /** ID of the `InternalAccount` that holds the non-EVM payment token. */
  walletAccountId: string;
};
