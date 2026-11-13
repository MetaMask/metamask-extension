import { KeyringTypes } from '@metamask/keyring-controller';
import {
  AWAITING_SIGNATURES_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  HARDWARE_WALLET_SIGNATURES_ROUTE,
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
 * Route prefixes where AUTO-SHOWN hardware wallet error modals are allowed.
 * Excludes bridge/quote pages (/cross-chain) so a locked device while browsing
 * quotes does not block the flow; lock validation happens at submit time.
 * Manually triggered errors (via showErrorModal) are not affected.
 */
export const HARDWARE_WALLET_ERROR_MODAL_ROUTE_PREFIXES = [
  CONFIRM_TRANSACTION_ROUTE, // /confirm-transaction (transactions + signature requests)
  CONFIRMATION_V_NEXT_ROUTE, // /confirmation (redesigned confirmation flow)
  AWAITING_SIGNATURES_ROUTE, // /swaps/awaiting-signatures (defensive; real signing page is below)
  `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`, // /cross-chain/swaps/hardware-wallet-signatures (signing phase: app-closed modal + sendBundle auto-restart recovery)
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

/**
 * Check if a pathname is a route where hardware wallet error modals may be
 * AUTO-SHOWN by the HardwareWalletErrorProvider.
 *
 * This gates auto-shown modals only; manually shown modals (via
 * showErrorModal) are unaffected.
 *
 * @param pathname - Route pathname to check.
 * @returns True when the route matches any auto-show error modal prefix.
 */
export function isHardwareWalletErrorModalRoute(pathname: string): boolean {
  return HARDWARE_WALLET_ERROR_MODAL_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}
