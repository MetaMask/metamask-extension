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
    console.log(LOG_TAG, 'Connecting to device:', deviceId);

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
      console.error(LOG_TAG, 'Connection error:', error);

      // Clean up on error
      this.connected = false;
      this.currentDeviceId = null;

      const hwError = reconstructHardwareWalletError(
        error,
        HardwareWalletType.Ledger,
      );

      console.log(LOG_TAG, 'Connection failed with error:', {
        code: hwError.code,
      });

      const errorCode = hwError.code;

      if (errorCode) {
        if (
          errorCode === ErrorCode.AuthenticationDeviceLocked ||
          errorCode === ErrorCode.AuthenticationDeviceBlocked
        ) {
          console.log(LOG_TAG, 'Emitting DEVICE_LOCKED event from connect');
          this.options.onDeviceEvent({
            event: DeviceEvent.DeviceLocked,
            error: hwError,
          });
        } else if (errorCode === ErrorCode.DeviceStateEthAppClosed) {
          console.log(LOG_TAG, 'Emitting APP_NOT_OPEN event from connect');
          this.options.onDeviceEvent({
            event: DeviceEvent.AppNotOpen,
            error: hwError,
          });
        } else if (errorCode === ErrorCode.DeviceDisconnected) {
          console.log(LOG_TAG, 'Emitting DISCONNECTED event from connect');
          this.options.onDeviceEvent({
            event: DeviceEvent.Disconnected,
            error: hwError,
          });
        } else {
          console.log(LOG_TAG, 'Emitting CONNECTION_FAILED event from connect');
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
  async verifyDeviceReady(deviceId: string): Promise<boolean> {
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
      console.log(LOG_TAG, 'Calling getAppNameAndVersion');
      // Get the app name and version from the Ledger device
      const { appName } = await getAppNameAndVersion();
      console.log(LOG_TAG, 'Ledger app info:', appName);

      if (appName !== 'Ethereum') {
        throw createHardwareWalletError(
          ErrorCode.DeviceStateEthAppClosed,
          HardwareWalletType.Ledger,
          `Ethereum app is not open, got ${appName}`,
        );
      }

      return true;
    } catch (error) {
      console.error(LOG_TAG, 'Error verifying device ready:', error);

      if (error instanceof HardwareWalletError && error.code) {
        // Emit appropriate device events with the properly reconstructed error
        if (
          error.code === ErrorCode.AuthenticationDeviceLocked ||
          error.code === ErrorCode.AuthenticationDeviceBlocked
        ) {
          console.log(LOG_TAG, 'Emitting DEVICE_LOCKED event');
          this.options.onDeviceEvent({
            event: DeviceEvent.DeviceLocked,
            error,
          });
        } else if (error.code === ErrorCode.DeviceStateEthAppClosed) {
          console.log(LOG_TAG, 'Emitting APP_NOT_OPEN event');
          this.options.onDeviceEvent({
            event: DeviceEvent.AppNotOpen,
            error,
          });
        } else if (error.code === ErrorCode.DeviceDisconnected) {
          console.log(LOG_TAG, 'Emitting DISCONNECTED event');
          this.options.onDeviceEvent({
            event: DeviceEvent.Disconnected,
            error,
          });
        } else {
          // Catch-all for other errors
          console.log(LOG_TAG, 'Emitting DISCONNECTED event (catch-all)');
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
