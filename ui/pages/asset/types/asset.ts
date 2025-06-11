import { Hex } from '@metamask/utils';
import { AssetType } from '../../../../shared/constants/transaction';

/** Information about a native or token asset */
export type Asset = (
  | {
      type: AssetType.native;
      /** Whether the symbol has been verified to match the chain */
      isOriginalNativeSymbol: boolean;
    }
  | {
      type: AssetType.token;
      /** The token's contract address */
      address: string;
      /** An array of token list sources the asset appears in, e.g. [1inch,Sushiswap]  */
      aggregators?: string[];
    }
) & {
  /** The number of decimal places to move left when displaying balances */
  decimals: number;
  /** The hexadecimal chain id */
  chainId: Hex;
  /** The asset's symbol, e.g. 'ETH' */
  symbol: string;
  /** The asset's name, e.g. 'Ethereum' */
  name?: string;
  /** A URL to the asset's image */
  image: string;
  /** True if the asset implements ERC721 */
  isERC721?: boolean;
  balance?: { value: string; display: string; fiat: string };
};

export type NativeAsset = Omit<Asset, 'type'> & {
  type: typeof AssetType.native;
  isOriginalNativeSymbol: boolean;
};

export type TokenAsset = Omit<Asset, 'type'> & {
  type: typeof AssetType.token;
  address: string;
  aggregators?: string[];
};

export const isNativeAsset = (inputAsset: Asset): inputAsset is NativeAsset =>
  inputAsset.type === AssetType.native &&
  'isOriginalNativeSymbol' in inputAsset &&
  typeof inputAsset.isOriginalNativeSymbol === 'boolean';

export const isTokenAsset = (inputAsset: Asset): inputAsset is TokenAsset =>
  inputAsset.type === AssetType.token &&
  'address' in inputAsset &&
  typeof inputAsset.address === 'string' &&
  ('aggregators' in inputAsset
    ? typeof inputAsset.aggregators === 'object' &&
      (!inputAsset.aggregators.length ||
        typeof inputAsset.aggregators[0] === 'string')
    : true);
