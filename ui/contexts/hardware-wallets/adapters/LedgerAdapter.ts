import { ErrorCode } from '@metamask/hw-wallet-sdk';
import {
  attemptLedgerTransportCreation,
  getAppNameAndVersion,
  getHdPathForLedgerKeyring,
  getLedgerAppConfiguration,
  getLedgerPublicKey,
} from '../../../store/actions';
import { createHardwareWalletError, getDeviceEventForError } from '../errors';
import { toHardwareWalletError } from '../rpcErrorUtils';
import {
  DeviceEvent,
  HardwareWalletType,
  type EnsureDeviceReadyOptions,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';
import {
  getConnectedLedgerDevices,
  isWebHidAvailable,
  subscribeToWebHidEvents,
} from '../webConnectionUtils';

/**
 * Ledger adapter implementation
 * Verifies WebHID device presence AND ensures Ethereum app is open.
 * Actual signing operations happen through MetaMask's normal flow via KeyringController.
 */
export class LedgerAdapter implements HardwareWalletAdapter {
  private options: HardwareWalletAdapterOptions;

  private connected = false;

  private isConnecting = false;

  private pendingConnection: Promise<void> | null = null;

  private unsubscribeHidEvents: (() => void) | null = null;

  constructor(options: HardwareWalletAdapterOptions) {
    this.options = options;
    this.setupHidEventListeners();
  }

  /**
   * Set up WebHID event listeners for proactive disconnect detection.
   * This allows the UI to immediately reflect when the device is unplugged,
   * rather than waiting until the next operation attempt.
   */
  private setupHidEventListeners(): void {
    this.unsubscribeHidEvents = subscribeToWebHidEvents(
      HardwareWalletType.Ledger,
      // onConnect - device plugged in (could be used for auto-reconnect in the future)
      () => {
        // Currently no-op: we don't auto-reconnect when device is plugged in
        // The user will trigger connect through UI action
      },
      // onDisconnect - device unplugged
      () => {
        // Only emit disconnect if we were tracking a connection
        if (this.connected) {
          this.connected = false;
          this.options.onDeviceEvent({
            event: DeviceEvent.Disconnected,
          });
        }
      },
    );
  }

  /**
   * Check if device is currently connected via WebHID
   */
  private async checkDeviceConnected(): Promise<HIDDevice | undefined> {
    const devices = await getConnectedLedgerDevices();
    // We only use the first ledger device for
    return devices.length > 0 ? devices[0] : undefined;
  }

  private async getHdPath(): Promise<string> {
    const path = await getHdPathForLedgerKeyring();
    return path;
  }

  /**
   * Connect to Ledger device
   * Verifies device is physically connected AND Ethereum app is open
   *
   */
  async connect(): Promise<void> {
    // Already connected to the same device - return immediately
    if (this.connected) {
      return;
    }

    // Connection in progress - check if it's for the same device
    if (this.isConnecting && this.pendingConnection) {
      // Connecting to a different device - wait for current connection to complete/fail,
      // then disconnect and connect to the new device
      try {
        await this.pendingConnection;
      } catch {
        // Ignore errors from the pending connection - we'll try to connect to the new device
      }
      // If we got here, the previous connection completed or failed
      // Disconnect if connected and try to connect to the new device
      if (this.connected) {
        await this.disconnect();
      }
    }

    // Start new connection - track the device we're connecting to
    this.isConnecting = true;
    this.pendingConnection = (async () => {
      try {
        // Step 1: Check WebHID availability
        if (!isWebHidAvailable()) {
          throw createHardwareWalletError(
            ErrorCode.ConnectionTransportMissing,
            HardwareWalletType.Ledger,
            'WebHID is not available',
          );
        }

        // Step 2: Check if device is physically connected
        const connectedLedgerDevice = await this.checkDeviceConnected();
        if (!connectedLedgerDevice) {
          throw createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            HardwareWalletType.Ledger,
            'Ledger device not found. Please connect your Ledger device.',
          );
        }

        // Step 3: Check if device is unlocked. This is only for Nano S and Nano X because there
        // is no way to detect if the device is locked on Nano S Plus without attempting an action.
        // This is a hack. Any errors would show device is locked when that might not be true.
        const productName = connectedLedgerDevice.productName ?? '';
        if (['Nano S', 'Nano X', 'Nano S Plus'].includes(productName)) {
          const hdPath = await this.getHdPath();
          await getLedgerPublicKey(hdPath);
        }

        // Step 4: Attempt to create a transport for the device
        await attemptLedgerTransportCreation();

        // Mark as connected - device is present AND app is open
        this.connected = true;
      } catch (error) {
        // Clean up on error
        this.connected = false;

        const hwError = toHardwareWalletError(error, HardwareWalletType.Ledger);

        const deviceEvent = getDeviceEventForError(hwError.code);

        this.options.onDeviceEvent({
          event: deviceEvent,
          error: hwError,
        });

        throw hwError;
      } finally {
        this.isConnecting = false;
        this.pendingConnection = null;
      }
    })();

    return this.pendingConnection;
  }

  /**
   * Disconnect from Ledger device
   */
  async disconnect(): Promise<void> {
    try {
      this.connected = false;

      this.options.onDeviceEvent({
        event: DeviceEvent.Disconnected,
      });
    } catch (error) {
      this.options.onDisconnect(error);
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Unsubscribe from WebHID events
    this.unsubscribeHidEvents?.();
    this.unsubscribeHidEvents = null;

    // The offscreen ledger script cleans up the transport after each action.
    // See closeTransport() in app/offscreen/ledger.ts
    this.connected = false;
    this.isConnecting = false;
    // TODO: Potential race conditon: Destroy may override pending connection before it resolves.
    this.pendingConnection = null;
  }

  /**
   * Verify the device is ready for operations (Ethereum app is open)
   * Throws HardwareWalletError from the KeyringController/Ledger keyring
   * These errors are already properly formatted and include all necessary metadata
   *
   * @param options - Optional settings to control readiness checks
   * @param options.requireBlindSigning - Whether to check if blind signing is enabled
   * on the Ledger device. Defaults to true. Set to false for simple sends (plain
   * native asset transfers) that don't involve contract interactions.
   * @returns true if device is ready
   */
  async ensureDeviceReady(
    options?: EnsureDeviceReadyOptions,
  ): Promise<boolean> {
    const { requireBlindSigning = true } = options ?? {};

    if (!this.isConnected()) {
      await this.connect();
    }

    try {
      // Get the app name and version from the Ledger device
      const { appName } = await getAppNameAndVersion();
      if (appName !== 'Ethereum') {
        throw createHardwareWalletError(
          ErrorCode.DeviceStateEthAppClosed,
          HardwareWalletType.Ledger,
          `Ethereum app is not open, got ${appName}`,
        );
      }

      // Blind signing check: only needed for contract interactions, signatures,
      // and dapp transactions. Simple sends (plain native asset transfers) do not
      // require blind signing since the Ledger can display them natively.
      if (requireBlindSigning) {
        const { arbitraryDataEnabled } = await getLedgerAppConfiguration();
        if (arbitraryDataEnabled !== 1) {
          throw createHardwareWalletError(
            ErrorCode.DeviceStateBlindSignNotSupported,
            HardwareWalletType.Ledger,
            'Blind signing is not enabled',
          );
        }
      }

      return true;
    } catch (error) {
      const hwError = toHardwareWalletError(error, HardwareWalletType.Ledger);
      // Emit appropriate device events with the properly reconstructed error
      const deviceEvent = getDeviceEventForError(
        hwError.code,
        DeviceEvent.Disconnected,
      );
      this.options.onDeviceEvent({
        event: deviceEvent,
        error: hwError,
      });

      // Reset connection state for disconnection-related errors
      const shouldResetConnection = [
        ErrorCode.DeviceDisconnected,
        ErrorCode.ConnectionClosed,
      ].includes(hwError.code);

      if (shouldResetConnection || deviceEvent === DeviceEvent.Disconnected) {
        this.connected = false;
      }
      throw hwError;
    }
  }
}
