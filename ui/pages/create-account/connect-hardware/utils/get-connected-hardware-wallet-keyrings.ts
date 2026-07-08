import type { KeyringObject } from '@metamask/keyring-controller';
import { KeyringType } from '../../../../../shared/constants/keyring';

/** Hardware keyring types supported by connect-hardware flows. */
export const HARDWARE_WALLET_KEYRING_TYPES = [
  KeyringType.ledger,
  KeyringType.trezor,
  KeyringType.lattice,
  KeyringType.qr,
  KeyringType.oneKey,
] as const;

/** Hardware keyring type value from {@link HARDWARE_WALLET_KEYRING_TYPES}. */
export type HardwareWalletKeyringType =
  (typeof HARDWARE_WALLET_KEYRING_TYPES)[number];

/**
 * Filters MetaMask keyrings to hardware wallets with imported accounts.
 * Used when reporting connected-device metrics and determining whether this
 * device type was already connected before the current import.
 *
 * @param keyrings - Keyrings from MetaMask state.
 * @returns Hardware keyrings with at least one imported account.
 */
export function getConnectedHardwareWalletKeyrings(
  keyrings: KeyringObject[],
): KeyringObject[] {
  return keyrings.filter(
    (keyring) =>
      (HARDWARE_WALLET_KEYRING_TYPES as readonly string[]).includes(
        keyring.type,
      ) && keyring.accounts.length > 0,
  );
}
