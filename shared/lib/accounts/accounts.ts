import type { InternalAccount } from '@metamask/keyring-internal-api';
import { HardwareDeviceNames } from '../../constants/hardware-wallets';

export function isHardwareAccount(account: InternalAccount): boolean {
  try {
    const keyringType = account?.metadata?.keyring?.type;
    return Object.values(HardwareDeviceNames).includes(
      keyringType as HardwareDeviceNames,
    );
  } catch {
    return false;
  }
}
