import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { LEDGER_USB_VENDOR_ID } from '../../../../shared/constants/hardware-wallets';
import {
  attemptLedgerTransportCreation,
  getAppNameAndVersion,
} from '../../../store/actions';
import { createHardwareWalletError, getDeviceEventForError } from '../errors';
import { reconstructHardwareWalletError } from '../rpcErrorUtils';
import {
  DeviceEvent,
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';
import { subscribeToWebHidEvents } from '../webConnectionUtils';

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

  private currentDeviceId: string | null = null;

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
        if (this.connected || this.currentDeviceId) {
          this.connected = false;
          this.currentDeviceId = null;
          this.options.onDeviceEvent({
            event: DeviceEvent.Disconnected,
          });
        }
      },
    );
  }

  /**
   * Check if WebHID is available
   */
  private isWebHIDAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.navigator !== 'undefined' &&
      'hid' in window.navigator
    );
  }

  /**
   * Check if device is currently connected via WebHID
   */
  private async checkDeviceConnected(): Promise<boolean> {
    if (!this.isWebHIDAvailable()) {
      return false;
    }

    try {
      const devices = await window.navigator.hid.getDevices();
      return devices.some(
        (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Connect to Ledger device
   * Verifies device is physically connected AND Ethereum app is open
   *
   * @param deviceId - The device ID to connect to
   */
  async connect(deviceId: string): Promise<void> {
    // Already connected to the same device - return immediately
    if (this.connected && this.currentDeviceId === deviceId) {
      return;
    }

    // Already connected to a different device - disconnect firste
    if (this.connected && this.currentDeviceId !== deviceId) {
      await this.disconnect();
    }

    // Connection in progress - check if it's for the same device
    if (this.isConnecting && this.pendingConnection) {
      if (this.currentDeviceId === deviceId) {
        // Same device - reuse the pending promise
        return this.pendingConnection;
      }
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
    this.currentDeviceId = deviceId;
    this.pendingConnection = (async () => {
      try {
        // Step 1: Check WebHID availability
        if (!this.isWebHIDAvailable()) {
          throw createHardwareWalletError(
            ErrorCode.ConnectionTransportMissing,
            HardwareWalletType.Ledger,
            'WebHID is not available',
          );
        }

        // Step 2: Check if device is physically connected
        const isDeviceConnected = await this.checkDeviceConnected();
        if (!isDeviceConnected) {
          throw createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            HardwareWalletType.Ledger,
            'Ledger device not found. Please connect your Ledger device.',
          );
        }

        // Step 3: Attempt to create a transport for the device
        await attemptLedgerTransportCreation();

        // Mark as connected - device is present AND app is open
        this.connected = true;
        this.currentDeviceId = deviceId;
      } catch (error) {
        // Clean up on error
        this.connected = false;
        this.currentDeviceId = null;

        const hwError = reconstructHardwareWalletError(
          error,
          HardwareWalletType.Ledger,
        );

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
      this.currentDeviceId = null;

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

    // Ledger iframe will clean up the connection after each transaction.
    // https://github.com/MetaMask/ledger-iframe-bridge/blob/1e02823f47306ae27fe941f2829ad8d142454a67/ledger-bridge.js#L143-L161
    this.connected = false;
    this.isConnecting = false;
    this.currentDeviceId = null;
  }

  /**
   * Verify the device is ready for operations (Ethereum app is open)
   * Throws HardwareWalletError from the KeyringController/Ledger keyring
   * These errors are already properly formatted and include all necessary metadata
   *
   * @param deviceId - The device ID to verify
   * @returns true if device is ready
   */
  async ensureDeviceReady(deviceId: string): Promise<boolean> {
    // If connected to a different device, reconnect to the requested device
    if (this.isConnected() && this.currentDeviceId !== deviceId) {
      await this.disconnect();
    }

    if (!this.isConnected()) {
      await this.connect(deviceId);
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

      return true;
    } catch (error) {
      if (error instanceof HardwareWalletError && error.code !== undefined) {
        // Emit appropriate device events with the properly reconstructed error
        const deviceEvent = getDeviceEventForError(
          error.code,
          DeviceEvent.Disconnected,
        );
        this.options.onDeviceEvent({
          event: deviceEvent,
          error,
        });

        // Reset connection state for disconnection-related errors
        const shouldResetConnection = [
          ErrorCode.DeviceDisconnected,
          ErrorCode.ConnectionClosed,
        ].includes(error.code);

        if (shouldResetConnection || deviceEvent === DeviceEvent.Disconnected) {
          this.connected = false;
          this.currentDeviceId = null;
        }
      }

      throw error;
    }
  }
}
