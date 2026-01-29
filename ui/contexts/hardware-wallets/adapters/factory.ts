import {
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';

/**
 * Creates an adapter for the given hardware wallet type.
 *
 * @param walletType - The type of hardware wallet, or null/undefined for regular accounts
 * @param _adapterOptions - Options for the adapter including event callbacks
 * @throws Error if the wallet type is unsupported
 */
export function createAdapterForHardwareWalletType(
  walletType: HardwareWalletType | null | undefined,
  _adapterOptions: HardwareWalletAdapterOptions,
): HardwareWalletAdapter {
  switch (walletType) {
    default:
      throw new Error(
        `Unsupported hardware wallet type: ${String(walletType)}`,
      );
  }
}
