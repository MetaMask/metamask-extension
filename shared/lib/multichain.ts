import { validate, Network } from 'bitcoin-address-validation';

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
