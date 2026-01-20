import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { LEDGER_USB_VENDOR_ID } from '../../../../shared/constants/hardware-wallets';
import {
  attemptLedgerTransportCreation,
  getAppNameAndVersion,
} from '../../../store/actions';
import { createHardwareWalletError } from '../errors';
import {
  DeviceEvent,
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';
import { reconstructHardwareWalletError } from '../rpcErrorUtils';

const LOG_TAG = '[LedgerAdapter]';

/**
 * Ledger adapter implementation
 * Verifies WebHID device presence AND ensures Ethereum app is open.
 * Actual signing operations happen through MetaMask's normal flow via KeyringController.
 */
export class LedgerAdapter implements HardwareWalletAdapter {
  private options: HardwareWalletAdapterOptions;

  private connected = false;

  private currentDeviceId: string | null = null;

  constructor(options: HardwareWalletAdapterOptions) {
    this.options = options;
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
      console.error(LOG_TAG, 'Error checking device connection:', error);
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

      const errorCode = hwError.code;

      if (errorCode) {
        if (
          errorCode === ErrorCode.AuthenticationDeviceLocked ||
          errorCode === ErrorCode.AuthenticationDeviceBlocked
        ) {
          this.options.onDeviceEvent({
            event: DeviceEvent.DeviceLocked,
            error: hwError,
          });
        } else if (errorCode === ErrorCode.DeviceStateEthAppClosed) {
          this.options.onDeviceEvent({
            event: DeviceEvent.AppNotOpen,
            error: hwError,
          });
        } else if (errorCode === ErrorCode.DeviceDisconnected) {
          this.options.onDeviceEvent({
            event: DeviceEvent.Disconnected,
            error: hwError,
          });
        } else {
          this.options.onDeviceEvent({
            event: DeviceEvent.ConnectionFailed,
            error: hwError,
          });
        }
      }

      throw hwError;
    }
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
    console.log(LOG_TAG, 'Destroying adapter');

    this.connected = false;
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
    if (!this.isConnected()) {
      try {
        await this.connect(deviceId);
      } catch (error) {
        throw createHardwareWalletError(
          ErrorCode.DeviceDisconnected,
          HardwareWalletType.Ledger,
          error instanceof Error ? error.message : 'Unknown error',
          {
            cause: error instanceof Error ? error : undefined,
          },
        );
      }
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
      if (error instanceof HardwareWalletError && error.code) {
        // Emit appropriate device events with the properly reconstructed error
        if (
          error.code === ErrorCode.AuthenticationDeviceLocked ||
          error.code === ErrorCode.AuthenticationDeviceBlocked
        ) {
          this.options.onDeviceEvent({
            event: DeviceEvent.DeviceLocked,
            error,
          });
        } else if (error.code === ErrorCode.DeviceStateEthAppClosed) {
          this.options.onDeviceEvent({
            event: DeviceEvent.AppNotOpen,
            error,
          });
        } else if (error.code === ErrorCode.DeviceDisconnected) {
          this.options.onDeviceEvent({
            event: DeviceEvent.Disconnected,
            error,
          });
          // Reset connection state when device is disconnected
          this.connected = false;
          this.currentDeviceId = null;
        } else if (error.code === ErrorCode.ConnectionClosed) {
          this.options.onDeviceEvent({
            event: DeviceEvent.Disconnected,
            error,
          });
          // Reset connection state when connection is closed
          this.connected = false;
          this.currentDeviceId = null;
        } else {
          // Catch-all for other errors
          this.options.onDeviceEvent({
            event: DeviceEvent.Disconnected,
            error,
          });
        }
      }

      throw error;
    }
  }
}
