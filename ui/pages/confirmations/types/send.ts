import { KeyringAccountType } from '@metamask/keyring-api';
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
  accountType?: KeyringAccountType;
  address?: string;
  assetId?: string;
  balance?: string | number | undefined;
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
  error?: string;
  resolvedLookup?: string;
  warning?: string;
  toAddressValidated?: string;
  loading?: boolean;
  protocol?: string;
};

/**
 * Quote type for swap-send operations
 */
export type Quote = {
  aggregator: string;
  aggregatorType: string;
  destinationToken: string;
  sourceToken: string;
  sourceAmount: string;
  destinationAmount: string;
  trade: {
    data: string;
    from: string;
    to: string;
    value: string;
  };
  sender: string;
  recipient: string;
  error: string | null;
  gasParams: {
    maxGas: number;
    averageGas: number;
    estimatedRefund: number;
    gasMultiplier: number;
  };
  fee: number;
  approvalNeeded: unknown | null;
  priceSlippage: {
    bucket: unknown | null;
    calculationError: unknown | null;
    destinationAmountInETH: unknown | null;
    destinationAmountInNativeCurrency: unknown | null;
    destinationAmountInUSD: unknown | null;
    ratio: unknown | null;
    sourceAmountInETH: unknown | null;
    sourceAmountInNativeCurrency: unknown | null;
    sourceAmountInUSD: unknown | null;
  };
};
