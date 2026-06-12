import { KeyringTypes } from '@metamask/keyring-controller';
import {
  AWAITING_SIGNATURES_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
} from '../../helpers/constants/routes';

import { HardwareWalletType } from './types';

/**
 * Route prefixes where hardware wallet error handling and auto-connect apply.
 */
export const HARDWARE_WALLET_ROUTE_PREFIXES = [
  CONFIRM_TRANSACTION_ROUTE, // /confirm-transaction (transactions + signature requests)
  CONFIRMATION_V_NEXT_ROUTE, // /confirmation (redesigned confirmation flow)
  CROSS_CHAIN_SWAP_ROUTE, // /cross-chain (bridge pages)
  AWAITING_SIGNATURES_ROUTE, // /swaps/awaiting-signatures
];

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

/**
 * Check if a pathname is a hardware-wallet flow route.
 *
 * @param pathname - Route pathname to check.
 * @returns True when the route matches any hardware-wallet flow prefix.
 */
export function isHardwareWalletRoute(pathname: string): boolean {
  return HARDWARE_WALLET_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}
