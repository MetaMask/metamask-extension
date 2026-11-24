import { isEvmAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import {
  hexToBigInt,
  KnownCaipNamespace,
  numberToHex,
  parseCaipAssetType,
  toCaipAssetType,
  type CaipAssetType,
  type Hex,
} from '@metamask/utils';
import { CHAIN_IDS } from '../../constants/network';
import {
  NATIVE_TOKEN_ADDRESS,
  POLYGON_NATIVE_TOKEN_ADDRESS,
} from '../../constants/transaction';
import { getNativeAssetId } from '../asset-utils';
import { toChecksumHexAddress } from '../hexstring-utils';

/** EVM token identified by its Hex chain ID and token address. */
export type EvmTokenReference = {
  address: Hex;
  chainId: Hex;
};

/**
 * Native token address MetaMask Pay uses for an EVM chain, matching
 * `TransactionPayController`.
 *
 * @param chainId - Hex chain ID.
 * @returns The native token address.
 */
function getPayNativeTokenAddress(chainId: Hex): Hex {
  return chainId === CHAIN_IDS.POLYGON
    ? POLYGON_NATIVE_TOKEN_ADDRESS
    : NATIVE_TOKEN_ADDRESS;
}

/**
 * Derive the Hex chain ID and token address of an EVM CAIP-19 asset ID.
 * A `slip44` native asset maps to the chain's native token address.
 *
 * @param assetId - CAIP-19 asset ID.
 * @returns The Hex chain ID and token address, or `undefined` for an asset
 * that is not on an EVM chain.
 */
export function decodeEvmAssetId(
  assetId: CaipAssetType,
): EvmTokenReference | undefined {
  const { chain, assetNamespace, assetReference } = parseCaipAssetType(assetId);

  if (chain.namespace !== KnownCaipNamespace.Eip155) {
    return undefined;
  }

  const chainId = numberToHex(Number(chain.reference));
  const address =
    assetNamespace === 'slip44'
      ? getPayNativeTokenAddress(chainId)
      : (assetReference as Hex);

  return { address, chainId };
}

/**
 * Build the CAIP-19 asset ID of an EVM token, as keyed in `AssetsController`
 * state: the chain's `slip44` native asset for the native token address, and a
 * checksummed `erc20` asset otherwise.
 *
 * @param token - EVM token.
 * @param token.address - Token address, or the chain's native token address.
 * @param token.chainId - Hex chain ID.
 * @returns The CAIP-19 asset ID.
 */
export function encodeEvmAssetId({
  address,
  chainId,
}: EvmTokenReference): CaipAssetType {
  // On Polygon, token lists use the zero address for native POL while Pay uses
  // `0x…1010`; both are the native asset.
  const isNative = [
    NATIVE_TOKEN_ADDRESS,
    getPayNativeTokenAddress(chainId),
  ].some(
    (nativeAddress) => address.toLowerCase() === nativeAddress.toLowerCase(),
  );
  const chainReference = hexToBigInt(chainId).toString();

  if (isNative) {
    // `AssetsController` keys the native asset of a chain missing from the
    // native asset registry, such as a custom network, by the zero-address
    // ERC-20 encoding.
    return (
      getNativeAssetId(chainId) ??
      toCaipAssetType(
        KnownCaipNamespace.Eip155,
        chainReference,
        'erc20',
        NATIVE_TOKEN_ADDRESS,
      )
    );
  }

  return toCaipAssetType(
    KnownCaipNamespace.Eip155,
    chainReference,
    'erc20',
    toChecksumHexAddress(address),
  );
}

/**
 * Derive the Hex chain ID and token address of a payment token, for the EVM
 * lookups (market data, gas, no-fee routes) that are keyed by them.
 *
 * @param paymentToken - Payment token, if any.
 * @returns The Hex chain ID and token address, or `undefined` for none or a
 * non-EVM token.
 */
export function decodePaymentTokenAssetId(
  paymentToken: Pick<TransactionPaymentToken, 'assetId'> | undefined,
): EvmTokenReference | undefined {
  return paymentToken && decodeEvmAssetId(paymentToken.assetId);
}

/**
 * Whether two CAIP-19 asset IDs identify the same asset. EVM addresses are
 * case-insensitive, so asset IDs may differ in case only.
 *
 * @param assetId - CAIP-19 asset ID, if any.
 * @param otherAssetId - CAIP-19 asset ID to compare with, if any.
 * @returns Whether both are defined and identify the same asset.
 */
export function isSameAssetId(
  assetId: string | undefined,
  otherAssetId: string | undefined,
): boolean {
  return Boolean(
    assetId &&
    otherAssetId &&
    assetId.toLowerCase() === otherAssetId.toLowerCase(),
  );
}

/**
 * Address of the EVM account selected by a MetaMask Pay `accountOverride`,
 * which is the ID of an `InternalAccount`.
 *
 * @param accountOverride - Account override of the transaction, if any.
 * @param accounts - Internal accounts keyed by ID.
 * @returns The address of the override account when it is an EVM account,
 * otherwise `undefined`.
 */
export function getEvmAccountOverride(
  accountOverride: string | undefined,
  accounts: Record<string, InternalAccount>,
): Hex | undefined {
  const account = accountOverride ? accounts[accountOverride] : undefined;

  return account && isEvmAccountType(account.type)
    ? (account.address as Hex)
    : undefined;
}
