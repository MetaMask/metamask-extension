import {
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';
import { LedgerAdapter } from './LedgerAdapter';
import { NonHardwareAdapter } from './NonHardwareAdapter';
import { QrAdapter } from './QrAdapter';

/**
 * Creates an adapter for the given hardware wallet type.
 *
 * @param walletType - The type of hardware wallet, or null/undefined for regular accounts
 * @param adapterOptions - Options for the adapter including event callbacks
 * @returns The appropriate adapter instance
 */
export function createAdapterForHardwareWalletType(
  walletType: HardwareWalletType | null | undefined,
  adapterOptions: HardwareWalletAdapterOptions,
): HardwareWalletAdapter {
  switch (walletType) {
    case HardwareWalletType.Ledger:
      return new LedgerAdapter(adapterOptions);
    case HardwareWalletType.Qr:
      return new QrAdapter(adapterOptions);
    default:
      return new NonHardwareAdapter(adapterOptions);
  }
}
