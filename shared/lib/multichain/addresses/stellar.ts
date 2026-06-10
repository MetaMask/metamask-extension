/**
 * Stellar account addresses use strkey encoding: non-muxed accounts start with `G`
 * and are 56 characters long.
 *
 * @see https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts
 */
const STELLAR_G_ADDRESS_REGEX = /^G[A-HJ-NP-Z2-7]{55}$/u;

/**
 * Returns whether the given string is a valid Stellar G-address.
 *
 * @param address - Address to validate.
 */
export function isStellarAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmed = address.trim();
  return STELLAR_G_ADDRESS_REGEX.test(trimmed);
}
