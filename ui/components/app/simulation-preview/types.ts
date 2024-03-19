import { Hex } from '@metamask/utils';
import { TokenStandard } from '../../../../shared/constants/transaction';

/**
 * Identifies the native asset of a chain.
 */
export const NATIVE_ASSET: NativeAssetIdentifier = {
  standard: TokenStandard.none,
} as const;

/**
 * Identifies the native asset of a chain.
 */
export type NativeAssetIdentifier = {
  standard: TokenStandard.none;
  address?: undefined;
  tokenId?: undefined;
};

/**
 * Uniquely identifies an ERC20 token on a chain.
 */
export type Erc20AssetIdentifier = {
  standard: TokenStandard.ERC20;
  address: Hex;
  tokenId?: undefined;
};

/**
 * Uniquely identifies an ERC721 token on a chain.
 */
export type Erc721AssetIdentifier = {
  standard: TokenStandard.ERC721;
  address: Hex;
  tokenId: Hex;
};

/**
 * Uniquely identifies an ERC1155 token on a chain.
 */
export type Erc1155AssetIdentifier = {
  standard: TokenStandard.ERC1155;
  address: Hex;
  tokenId: Hex;
};

/**
 * Uniquely identifies an asset on a chain.
 */
export type AssetIdentifier =
  | NativeAssetIdentifier
  | Erc20AssetIdentifier
  | Erc721AssetIdentifier
  | Erc1155AssetIdentifier;

/**
 * Represents an amount of an asset, including its magnitude and sign.
 */
export type Amount = {
  /**
   * Indicates whether the amount is negative (e.g., a decrease in balance).
   */
  isNegative: boolean;

  /**
   * The quantity of the smallest denomination of the asset (base units),
   * represented as a hexadecimal string.
   * For example: In the case of ETH, this would be the number of wei.
   */
  quantity: Hex;

  /**
   * The exponent to apply to the quantity to convert it to the
   * amount of asset tokens in decimal form.
   * The formula is: `tokenAmount = hexToDecimal(quantity) * (10 ^ exponent)`.
   * For example: If the quantity is in wei and the exponent is
   * -18, the amount of ETH tokens would be the quantity
   * divided by 10^18.
   */
  exponent: number;
};

/**
 * Describes a change in an asset's balance to a user's wallet.
 */
export type BalanceChange = {
  asset: AssetIdentifier;
  amount: Amount;
};
