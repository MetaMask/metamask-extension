import { validate, Network } from 'bitcoin-address-validation';

/**
 * Multi-chain family type.
 */
export enum MultichainType {
  // Bitcoin-like:
  Bip122 = 'bip122',
  // Ethereum:
  Eip155 = 'eip155',
}

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
 * Returns the associated chain's type for the given address.
 *
 * @param address - The address to check.
 * @returns The chain's type for that address.
 */
export function getMultichainTypeFromAddress(address: string): MultichainType {
  if (isBtcMainnetAddress(address) || isBtcTestnetAddress(address)) {
    return MultichainType.Bip122;
  }
  // Defaults to "Ethereum" for all other cases for now.
  return MultichainType.Eip155;
}
