import {
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';
import { LedgerAdapter } from './LedgerAdapter';
import { TrezorAdapter } from './TrezorAdapter';

export function createAdapterForHardwareWalletType(
  walletType: HardwareWalletType,
  adapterOptions: HardwareWalletAdapterOptions,
): HardwareWalletAdapter {
  switch (walletType) {
    case HardwareWalletType.Ledger:
      return new LedgerAdapter(adapterOptions);
    case HardwareWalletType.Trezor:
      return new TrezorAdapter(adapterOptions);
    default:
      throw new Error(
        `Unsupported hardware wallet type: ${String(walletType)}`,
      );
  }
}
