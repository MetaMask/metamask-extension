import { Token, TokenListToken } from '@metamask/assets-controllers';
import { type Hex, type CaipChainId } from '@metamask/utils';
import type {
  AssetType,
  TokenStandard,
} from '../../../../../shared/constants/transaction';
import type { Asset } from '../../../../ducks/send';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../../../../shared/constants/network';
import { TokenWithFiatAmount } from '../../../app/assets/types';

export type NFT = {
  address: string;
  description: string | null;
  favorite: boolean;
  image?: string | string[];
  isCurrentlyOwned: boolean;
  name: string | null;
  standard: TokenStandard;
  tokenId: number;
  tokenURI?: string;
  type?: AssetType.NFT;
  symbol?: string;
  imageOriginal?: string;
  ipfsImageUpdated?: string;
  collection?: Record<string, string | number | boolean>;
  chainId: string;
};

/**
 * Passed in to AssetPicker, AssetPickerModal and AssetList as a prop
 * Since token interfaces can vary between experiences (i.e. send vs bridge,
 * these fields need to be set before passing an asset to the AssetPicker
 */
export type ERC20Asset = {
  type: AssetType.token;
  image: string;
  chainId: Hex | CaipChainId;
} & Pick<TokenListToken, 'address' | 'symbol'>;

export type NativeAsset = {
  type: AssetType.native;
  address?: null | string;
  image: typeof CHAIN_ID_TOKEN_IMAGE_MAP extends Record<string, infer V>
    ? V
    : never; // only allow wallet's hardcoded images
  symbol: typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP extends Record<string, infer V>
    ? V
    : never; // only allow wallet's hardcoded symbols
  chainId: Hex | CaipChainId;
};

/**
 * ERC20Asset or NativeAsset, plus additional fields for display purposes in the Asset component
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export type AssetWithDisplayData<T extends ERC20Asset | NativeAsset> = T & {
  balance: string; // raw balance
  string: string | undefined; // normalized balance as a stringified number
} & Pick<TokenListToken, 'decimals'> & {
    tokenFiatAmount?: TokenWithFiatAmount['tokenFiatAmount'];
  };

export type Collection = {
  collectionName: string;
  collectionImage: string | undefined;
  nfts: NFT[];
};

/**
 * Type of useTokenTracker's tokensWithBalances result
 */
export type TokenWithBalance = Token & { balance?: string; string?: string };

export { Asset };
