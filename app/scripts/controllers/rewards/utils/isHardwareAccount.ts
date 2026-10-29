import type { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { DEVICE_KEYRING_MAP } from '../../../../../shared/constants/hardware-wallets';

/**
 * Check if an account is a hardware wallet account
 *
 * @param account - The internal account to check
 * @returns True if the account is a hardware wallet, false otherwise
 */
export function isHardwareAccount(account: InternalAccount): boolean {
  try {
    const keyringType = account?.metadata?.keyring?.type;
    return Object.values(DEVICE_KEYRING_MAP).includes(
      keyringType as KeyringTypes,
    );
  } catch {
    return false;
  }
}
