import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import {
  getHdPathForHardwareKeyring,
  getTrezorDeviceStatus,
} from '../../../store/actions';
import { createHardwareWalletError, getDeviceEventForError } from '../errors';
import { toHardwareWalletError } from '../rpcErrorUtils';
import {
  DeviceEvent,
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';
import {
  getConnectedTrezorDevices,
  isWebUsbAvailable,
  subscribeToWebUsbEvents,
} from '../webConnectionUtils';

const LOG_TAG = '[TrezorAdapter]';

/**
 * Trezor adapter implementation
 * Verifies WebUSB device presence for Trezor hardware wallets.
 * Actual signing operations happen through MetaMask's normal flow via KeyringController.
 */
export class TrezorAdapter implements HardwareWalletAdapter {
  private options: HardwareWalletAdapterOptions;

  private connected = false;

  private pendingOperation = false;

  private currentDeviceId: string | null = null;

  private unsubscribeUsbEvents: (() => void) | null = null;

  constructor(options: HardwareWalletAdapterOptions) {
    this.options = options;
    this.setupUsbEventListeners();
  }

  /**
   * Set up WebUSB event listeners for proactive disconnect detection.
   * This allows the UI to immediately reflect when the device is unplugged,
   * rather than waiting until the next operation attempt.
   */
  private setupUsbEventListeners(): void {
    this.unsubscribeUsbEvents = subscribeToWebUsbEvents(
      HardwareWalletType.Trezor,
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
   * Check if device is currently connected via WebUSB
   */
  private async checkDeviceConnected(): Promise<boolean> {
    const devices = await getConnectedTrezorDevices();
    return devices.length > 0;
  }

  private async getHdPath(): Promise<string> {
    const path = await getHdPathForHardwareKeyring(HardwareDeviceNames.trezor);
    console.log(LOG_TAG, 'Hd path:', path);
    return path;
  }

  /**
   * Connect to Trezor device
   * Verifies device is physically connected via WebUSB
   *
   * @param deviceId - The device ID to connect to
   */
  async connect(deviceId: string): Promise<void> {
    console.log(LOG_TAG, 'Connecting to device:', deviceId);

    try {
      // Step 1: Check WebUSB availability
      if (!isWebUsbAvailable()) {
        throw createHardwareWalletError(
          ErrorCode.ConnectionTransportMissing,
          HardwareWalletType.Trezor,
          'WebUSB is not available',
        );
      }

      // Step 2: Check if device is physically connected
      const isDeviceConnected = await this.checkDeviceConnected();
      if (!isDeviceConnected) {
        throw createHardwareWalletError(
          ErrorCode.DeviceDisconnected,
          HardwareWalletType.Trezor,
          'Trezor device not found. Please connect your Trezor device.',
        );
      }

      // Mark as connected - device is present
      this.connected = true;
      this.currentDeviceId = deviceId;
    } catch (error) {
      console.error(LOG_TAG, 'Connection error:', error);

      // Clean up on error
      this.connected = false;
      this.currentDeviceId = null;

      const hwError = toHardwareWalletError(error, HardwareWalletType.Trezor);
      const deviceEvent = getDeviceEventForError(hwError.code);

      this.options.onDeviceEvent({
        event: deviceEvent,
        error: hwError,
      });

      throw hwError;
    }
  }

  /**
   * Disconnect from Trezor device
   */
  async disconnect(): Promise<void> {
    console.log(LOG_TAG, 'Disconnecting');

    try {
      this.connected = false;
      this.currentDeviceId = null;

      this.options.onDeviceEvent({
        event: DeviceEvent.Disconnected,
      });
    } catch (error) {
      console.error(LOG_TAG, 'Disconnect error:', error);
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
    console.log(LOG_TAG, 'Destroying adapter');

    // Unsubscribe from WebUSB events
    this.unsubscribeUsbEvents?.();
    this.unsubscribeUsbEvents = null;

    this.connected = false;
    this.currentDeviceId = null;
    this.pendingOperation = false;
  }

  /**
   * Set pending operation state
   *
   * @param pending - Whether an operation is pending
   */
  setPendingOperation(pending: boolean): void {
    this.pendingOperation = pending;
  }

  /**
   * Verify the device is ready for operations
   * Throws HardwareWalletError from the KeyringController/Trezor keyring
   * These errors are already properly formatted and include all necessary metadata
   *
   * Note: Unlike Ledger, Trezor doesn't require checking for a specific app being open.
   * The device just needs to be connected and unlocked, which is verified during signing operations.
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
      console.log(LOG_TAG, 'Verifying device is ready');

      // Check if the Trezor Connect session has been established.
      // This doesn't open a popup - it just checks internal session state.
      // The actual PIN/passphrase prompts happen during signing operations.
      const deviceStatus = await getTrezorDeviceStatus();

      console.log(LOG_TAG, 'Trezor device status:', deviceStatus);

      // Check if session exists (indicates Trezor Connect is initialized)
      if (!deviceStatus?._state?.sessionId) {
        throw createHardwareWalletError(
          ErrorCode.ConnectionClosed,
          HardwareWalletType.Trezor,
          'Trezor session not established. Please reconnect your device.',
        );
      }

      return true;
    } catch (error) {
      console.error(LOG_TAG, 'Error verifying device ready:', error);

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

        throw error;
      }

      // Convert unknown errors to HardwareWalletError
      const hwError = toHardwareWalletError(error, HardwareWalletType.Trezor);
      const deviceEvent = getDeviceEventForError(
        hwError.code,
        DeviceEvent.Disconnected,
      );

      this.options.onDeviceEvent({
        event: deviceEvent,
        error: hwError,
      });

      // Reset connection state for disconnection-related errors
      if (deviceEvent === DeviceEvent.Disconnected) {
        this.connected = false;
        this.currentDeviceId = null;
      }

      throw hwError;
    }
  }
}
