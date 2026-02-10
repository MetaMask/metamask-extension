import { KeyringTypes } from '@metamask/keyring-controller';

import { HardwareWalletType } from './types';

/**
 * Convert keyring type to hardware wallet type for error reconstruction
 *
 * @param keyringType - The keyring type from account metadata
 * @returns The hardware wallet type or null if not a hardware wallet
 */
export function keyringTypeToHardwareWalletType(
  keyringType?: string | null,
): HardwareWalletType | null {
  if (!keyringType) {
    return null;
  }

  switch (keyringType) {
    case KeyringTypes.ledger:
      return HardwareWalletType.Ledger;
    case KeyringTypes.trezor:
      return HardwareWalletType.Trezor;
    case KeyringTypes.oneKey:
      return HardwareWalletType.OneKey;
    case KeyringTypes.lattice:
      return HardwareWalletType.Lattice;
    case KeyringTypes.qr:
      return HardwareWalletType.Qr;
    default:
      return null;
  }
}
