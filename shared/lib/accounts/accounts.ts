import type { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { DEVICE_KEYRING_MAP } from '../../constants/hardware-wallets';

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
