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

/**
 * MetaMask Pay payment token on an EVM chain, with the Hex chain ID and token
 * address derived from its CAIP-19 asset ID.
 */
export type EvmPaymentToken = TransactionPaymentToken & {
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
export function getEvmAsset(
  assetId: CaipAssetType,
): { address: Hex; chainId: Hex } | undefined {
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
 * @param address - Token address, or the chain's native token address.
 * @param chainId - Hex chain ID.
 * @returns The CAIP-19 asset ID.
 */
export function getEvmAssetId(address: Hex, chainId: Hex): CaipAssetType {
  const isNative =
    address.toLowerCase() === getPayNativeTokenAddress(chainId).toLowerCase();
  const nativeAssetId = isNative ? getNativeAssetId(chainId) : undefined;

  return (
    nativeAssetId ??
    toCaipAssetType(
      KnownCaipNamespace.Eip155,
      hexToBigInt(chainId).toString(),
      'erc20',
      toChecksumHexAddress(address),
    )
  );
}

/**
 * Add the Hex chain ID and token address derived from its asset ID to an EVM
 * payment token. Hex address and chain lookups (market data, gas, no-fee
 * routes) only apply to EVM payment tokens.
 *
 * @param paymentToken - Payment token, if any.
 * @returns The EVM payment token, or `undefined` for none or a non-EVM token.
 */
export function getEvmPaymentToken(
  paymentToken: TransactionPaymentToken | undefined,
): EvmPaymentToken | undefined {
  const evmAsset = paymentToken && getEvmAsset(paymentToken.assetId);

  return evmAsset && { ...paymentToken, ...evmAsset };
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
