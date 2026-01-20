import {
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';

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
    default:
      throw new Error(
        `Unsupported hardware wallet type: ${String(walletType)}`,
      );
  }
}
