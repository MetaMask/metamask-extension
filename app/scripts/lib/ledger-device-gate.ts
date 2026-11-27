import log from 'loglevel';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import type { ConnectedLedgerDeviceInfo } from '../../../shared/constants/offscreen-communication';
import {
  HardwareWalletType,
  createHardwareWalletError,
} from '../../../shared/lib/hardware-wallets';

/** Structural Ledger keyring (or device-read facade); missing members fail open. */
export type LedgerGateKeyring = {
  bridge?: {
    getConnectedDeviceInfo?: () => Promise<ConnectedLedgerDeviceInfo[]>;
  } & Record<string, unknown>;
  getDeviceId?: () => string;
  setDeviceId?: (deviceId: string) => void;
};

/** Maps a WebHID product id to the model key stored in the device binding. */
export function getLedgerModelKey(productId: number): string {
  // Strip WebHID per-interface low byte (matches DMK's productId >> 8).
  // eslint-disable-next-line no-bitwise
  return productId >= 0x100 ? String(productId >> 8) : String(productId);
}

/** Binds the first connected Ledger model and blocks a different one. */
export class LedgerDeviceGate {
  /** Binds the first connected model and blocks a different one. */
  async enforceSingleDevice(
    keyring: LedgerGateKeyring,
    { allowBind }: { allowBind: boolean },
  ): Promise<void> {
    const connected = await this.#queryConnectedDevices(keyring);
    // Count rule awaits the hardware verdict: anything but exactly one device
    // fails open, for both bind and compare.
    if (!connected || connected.length !== 1) {
      return;
    }

    const boundModelKey = keyring.getDeviceId?.();
    if (!boundModelKey) {
      if (allowBind) {
        keyring.setDeviceId?.(getLedgerModelKey(connected[0].productId));
      }
      return;
    }

    if (getLedgerModelKey(connected[0].productId) !== boundModelKey) {
      throw createHardwareWalletError(
        ErrorCode.DeviceMultipleConnected,
        HardwareWalletType.Ledger,
      );
    }
  }

  async #queryConnectedDevices(
    keyring: LedgerGateKeyring,
  ): Promise<ConnectedLedgerDeviceInfo[] | null> {
    try {
      const connected = await keyring.bridge?.getConnectedDeviceInfo?.();
      return connected?.length ? connected : null;
    } catch (error) {
      // Includes the transient "No active Ledger handler" window during
      // offscreen recreation and the bridge's per-action timeout.
      log.warn(
        'Ledger device gate: connected-device query failed, failing open',
        error,
      );
      return null;
    }
  }
}
