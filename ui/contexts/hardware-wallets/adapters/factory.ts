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
 * @throws Error if the wallet type is unsupported
 */
export function createAdapterForHardwareWalletType(
  walletType: HardwareWalletType | null | undefined,
  // TODO: remove comment when adapterOptions is used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  adapterOptions: HardwareWalletAdapterOptions,
): HardwareWalletAdapter {
  switch (walletType) {
    default:
      throw new Error(
        `Unsupported hardware wallet type: ${String(walletType)}`,
      );
  }
}
