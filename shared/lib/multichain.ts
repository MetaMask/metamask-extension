import {
  CaipNamespace,
  isCaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import { validate, Network } from 'bitcoin-address-validation';
import { isAddress } from '@solana/addresses';
import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';

/**
 * Returns whether an address is on the Bitcoin mainnet.
 *
 * This function only checks the prefix of the address to determine if it's on
 * the mainnet or not. It doesn't validate the address itself, and should only
 * be used as a temporary solution until this information is included in the
 * account object.
 *
 * @param address - The address to check.
 * @returns `true` if the address is on the Bitcoin mainnet, `false` otherwise.
 */
export function isBtcMainnetAddress(address: string): boolean {
  return validate(address, Network.mainnet);
}

/**
 * Returns whether an address is on the Bitcoin testnet.
 *
 * See {@link isBtcMainnetAddress} for implementation details.
 *
 * @param address - The address to check.
 * @returns `true` if the address is on the Bitcoin testnet, `false` otherwise.
 */
export function isBtcTestnetAddress(address: string): boolean {
  return validate(address, Network.testnet);
}

/**
 * Returns whether an address is a valid Solana address, specifically an account's.
 * Derived addresses (like Program's) will return false.
 * See: https://stackoverflow.com/questions/71200948/how-can-i-validate-a-solana-wallet-address-with-web3js
 *
 * @param address - The address to check.
 * @returns `true` if the address is a valid Solana address, `false` otherwise.
 */
export function isSolanaAddress(address: string): boolean {
  return isAddress(address);
}

/**
 * Returns the associated chain's type for the given address.
 *
 * @param address - The address to check.
 * @returns The chain's type for that address.
 */
export function getCaipNamespaceFromAddress(address: string): CaipNamespace {
  if (isBtcMainnetAddress(address) || isBtcTestnetAddress(address)) {
    return KnownCaipNamespace.Bip122;
  }

  if (isSolanaAddress(address)) {
    return KnownCaipNamespace.Solana;
  }

  // Defaults to "Ethereum" for all other cases for now.
  return KnownCaipNamespace.Eip155;
}

export function isCurrentChainCompatibleWithAccount(
  chainId: string,
  account: InternalAccount,
): boolean {
  if (!chainId) {
    return false;
  }

  if (isCaipChainId(chainId)) {
    const { namespace } = parseCaipChainId(chainId);
    return namespace === getCaipNamespaceFromAddress(account.address);
  }

  // For EVM accounts, we do not check the chain ID format, but we just expect it
  // to be defined.
  return isEvmAccountType(account.type);
}
