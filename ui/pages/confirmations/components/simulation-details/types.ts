import { Hex } from '@metamask/utils';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import { Numeric } from '../../../../../shared/modules/Numeric';

export const NATIVE_ASSET_IDENTIFIER: NativeAssetIdentifier = {
  standard: TokenStandard.none,
};

/**
 * Describes an amount of fiat.
 */
export const FIAT_UNAVAILABLE = null;
export type FiatAmountAvailable = number;
export type FiatAmount = FiatAmountAvailable | typeof FIAT_UNAVAILABLE;

/**
 * Identifies the native asset of a chain.
 */
export type NativeAssetIdentifier = {
  standard: TokenStandard.none;
  address?: undefined;
  tokenId?: undefined;
};

/**
 * Uniquely identifies a token asset on a chain.
 */
export type TokenAssetIdentifier = {
  standard: Exclude<TokenStandard, TokenStandard.none>;
  address: Hex;
  tokenId?: Hex;
};

export type AssetIdentifier = Readonly<
  NativeAssetIdentifier | TokenAssetIdentifier
>;

/**
 * Represents an amount of an asset, including its magnitude and sign.
 */
export type Amount = Readonly<{
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
   * The number of decimal places the associated asset supports.
   *
   * This value is the negation of the exponent used when converting
   * the quantity to the decimal amount of a token.
   *
   * To calculate the token amount in decimal form, use the formula:
   * `tokenAmount = hexToDecimal(quantity) / (10 ^ decimals)`
   *
   * Example: If the asset is ETH, the quantity is expressed in wei
   * (the smallest unit of ETH) and decimals would be 18. The amount
   * of ETH tokens would be: `ethAmount = quantity / (10 ^ 18)`
   */
  decimals: number;

  /**
   * The numeric representation of the amount, taking into account the
   * sign, quantity and decimals.
   */
  numeric: Numeric;
}>;

/**
 * Describes a change in an asset's balance to a user's wallet.
 */
export type BalanceChange = {
  /**
   * The asset identifier for the balance change.
   */
  asset: AssetIdentifier;
  /**
   * The amount of the asset that changed.
   */
  amount: Amount;
  /**
   * The amount of fiat currency that corresponds to the asset amount.
   */
  fiatAmount: FiatAmount;
};
