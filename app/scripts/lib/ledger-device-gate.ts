import log from 'loglevel';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import type { ConnectedLedgerDeviceInfo } from '../../../shared/constants/offscreen-communication';
import {
  HardwareWalletErrorCode,
  HardwareWalletType,
  createHardwareWalletError,
  isLedgerAccountPathMissingError,
  isLedgerSeedMismatchMessage,
} from '../../../shared/lib/hardware-wallets';
import { normalizeAddress } from '../../../shared/lib/multichain/address';

/** Structural Ledger keyring (or device-read facade); missing members fail open. */
export type LedgerGateKeyring = {
  bridge?: {
    getConnectedDeviceInfo?: () => Promise<ConnectedLedgerDeviceInfo[]>;
  } & Record<string, unknown>;
  getDeviceId?: () => string;
  setDeviceId?: (deviceId: string) => void;
  getAccounts?: () => Promise<{ address: string }[]>;
  unlockAccountByAddress?: (address: string) => Promise<string>;
};

/** Maps a WebHID product id to the model key stored in the device binding. */
export function getLedgerModelKey(productId: number): string {
  // Strip WebHID per-interface low byte (matches DMK's productId >> 8).
  // eslint-disable-next-line no-bitwise
  return productId >= 0x100 ? String(productId >> 8) : String(productId);
}

/** Binds the first connected Ledger model and checks account ownership. */
export class LedgerDeviceGate {
  // One connection's verified addresses; a new connection is a different device.
  #verifiedAccounts: { connectionId: string; addresses: Set<string> } | null =
    null;

  /** Drops the ownership memo, e.g. after the device is removed. */
  clearMemo(): void {
    this.#verifiedAccounts = null;
  }

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

  /** Checks that the connected device derives the given account. */
  async verifyAccountOwnership(
    keyring: LedgerGateKeyring,
    address: string,
  ): Promise<void> {
    if (typeof keyring.unlockAccountByAddress !== 'function') {
      return;
    }

    const normalizedAddress = normalizeAddress(address);
    const connected = await this.#queryConnectedDevices(keyring);
    const connection = connected?.length === 1 ? connected[0] : null;

    if (!connection) {
      this.#verifiedAccounts = null;
    } else if (
      this.#verifiedAccounts?.connectionId === connection.connectionId &&
      this.#verifiedAccounts.addresses.has(normalizedAddress)
    ) {
      return;
    }

    try {
      await keyring.unlockAccountByAddress(normalizedAddress);
      if (!connection) {
        this.#verifiedAccounts = null;
      } else if (
        this.#verifiedAccounts?.connectionId === connection.connectionId
      ) {
        this.#verifiedAccounts.addresses.add(normalizedAddress);
      } else {
        this.#verifiedAccounts = {
          connectionId: connection.connectionId,
          addresses: new Set([normalizedAddress]),
        };
      }
    } catch (error) {
      this.#verifiedAccounts = null;
      if (
        error instanceof Error &&
        isLedgerSeedMismatchMessage(error.message)
      ) {
        throw createHardwareWalletError(
          HardwareWalletErrorCode.DeviceSeedMismatch,
          HardwareWalletType.Ledger,
          undefined,
          { metadata: { accountAddress: normalizedAddress } },
        );
      }
      if (isLedgerAccountPathMissingError(error)) {
        log.warn(
          'Ledger seed check skipped: no derivation path recorded for the account',
          error,
        );
        return;
      }
      log.warn('Ledger account ownership check failed, failing open', error);
    }
  }

  /** Verifies the keyring's first stored account, i.e. the one shown at connect. */
  async verifyFirstStoredAccount(keyring: LedgerGateKeyring): Promise<void> {
    let accounts: { address: string }[] | undefined;
    try {
      accounts = await keyring.getAccounts?.();
    } catch (error) {
      log.warn('Ledger first-account seed check failed, failing open', error);
      return;
    }

    const firstAccount = accounts?.[0]?.address;
    if (firstAccount) {
      await this.verifyAccountOwnership(keyring, firstAccount);
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
