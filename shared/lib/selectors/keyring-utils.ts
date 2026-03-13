/**
 * Pure keyring helpers. No UI or state dependencies.
 * Used by shared selectors to avoid circular dependency on ui/selectors.
 */

/**
 * Keyring-like object with optional type string.
 */
type KeyringLike = { type?: string } | null | undefined;

/**
 * Returns true if the keyring is a hardware wallet (type includes 'Hardware').
 *
 * @param keyring - Keyring object from state
 * @returns true if hardware wallet
 */
export function isHardwareWalletFromKeyring(keyring: KeyringLike): boolean {
  return Boolean(keyring?.type?.includes('Hardware'));
}

/**
 * Returns the hardware wallet type string, or undefined if not a hardware wallet.
 *
 * @param keyring - Keyring object from state
 * @returns type string e.g. "Ledger Hardware" or undefined
 */
export function getHardwareWalletTypeFromKeyring(
  keyring: KeyringLike,
): string | undefined {
  return isHardwareWalletFromKeyring(keyring) ? keyring?.type : undefined;
}
