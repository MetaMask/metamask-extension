import BN from 'bn.js';
import { Hex } from '@metamask/utils';

export enum AssetStandard {
  Native = 'native',
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
}

export const NFT_STANDARDS = [AssetStandard.ERC721, AssetStandard.ERC1155];

export type Asset = {
  accountAddress?: string;
  accountId?: string;
  address?: string;
  assetId?: string;
  balance?: BN | string | number | undefined;
  balanceInSelectedCurrency?: string;
  chainId?: string | number;
  collection?: {
    name?: string;
    [key: string]: unknown;
  };
  decimals?: number | undefined;
  fiat?: {
    balance?: number;
    currency?: string;
    conversionRate?: number;
  };
  image?: string;
  isNative?: boolean;
  name?: string | undefined;
  networkName?: string;
  networkImage?: string;
  shortenedBalance?: string;
  standard?: AssetStandard;
  symbol?: string | undefined;
  tokenId?: string;
  tokenURI?: string | undefined;
  primary?: string;
  rawBalance?: Hex;
};

export type RecipientValidationResult = {
  confusableCharacters?: {
    point: string;
    similarTo: string;
  }[];
  error?: string | null;
  resolvedLookup?: string | null;
  warning?: string | null;
};
