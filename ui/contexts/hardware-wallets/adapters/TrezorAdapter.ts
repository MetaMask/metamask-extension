import {
  HardwareDeviceNames,
  TREZOR_USB_VENDOR_IDS,
} from '../../../../shared/constants/hardware-wallets';
import {
  getHdPathForHardwareKeyring,
  getTrezorDeviceStatus,
} from '../../../store/actions';
import { createHardwareWalletError, ErrorCode } from '../errors';
import {
  DeviceEvent,
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';
import {
  extractHardwareWalletErrorCode,
  reconstructHardwareWalletError,
} from '../rpcErrorUtils';

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

  constructor(options: HardwareWalletAdapterOptions) {
    this.options = options;
  }

  /**
   * Check if WebUSB is available
   */
  private isWebUSBAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.navigator !== 'undefined' &&
      'usb' in window.navigator
    );
  }

  /**
   * Check if device is currently connected via WebUSB
   */
  private async checkDeviceConnected(): Promise<boolean> {
    if (!this.isWebUSBAvailable()) {
      return false;
    }

    try {
      const devices = await window.navigator.usb.getDevices();
      return devices.some((device) =>
        TREZOR_USB_VENDOR_IDS.some(
          (filter) =>
            device.vendorId === filter.vendorId &&
            device.productId === filter.productId,
        ),
      );
    } catch (error) {
      console.error(LOG_TAG, 'Error checking device connection:', error);
      return false;
    }
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
      if (!this.isWebUSBAvailable()) {
        throw createHardwareWalletError(
          ErrorCode.CONN_TRANSPORT_001,
          HardwareWalletType.Trezor,
          'WebUSB is not available',
        );
      }

      // Step 2: Check if device is physically connected
      const isDeviceConnected = await this.checkDeviceConnected();
      if (!isDeviceConnected) {
        throw createHardwareWalletError(
          ErrorCode.DEVICE_STATE_003,
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

      // Extract the error code from the JsonRpcError
      const errorCode = extractHardwareWalletErrorCode(error);

      if (errorCode) {
        // Call appropriate callbacks based on error code
        if (
          errorCode === ErrorCode.AUTH_LOCK_001 ||
          errorCode === ErrorCode.AUTH_LOCK_002
        ) {
          this.options.onDeviceLocked();
        }
      }

      // Reconstruct and re-throw as a proper HardwareWalletError
      const hwError = reconstructHardwareWalletError(
        error,
        HardwareWalletType.Trezor,
      );
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
  async verifyDeviceReady(deviceId: string): Promise<boolean> {
    try {
      console.log(LOG_TAG, 'Verifying device is ready');
      if (!this.isConnected()) {
        await this.connect(deviceId);
      }

      // // check if the device session has been created.
      // const {
      //   _state: { sessionId },
      // } = await getTrezorDeviceStatus();
      // if (!sessionId) {
      //   throw createHardwareWalletError(
      //     ErrorCode.DEVICE_STATE_002,
      //     HardwareWalletType.Trezor,
      //   );
      // }

      return true;
    } catch (error) {
      console.error(LOG_TAG, 'Error verifying device ready:', error);

      // Extract the error code from the JsonRpcError
      // When errors cross the RPC boundary, HardwareWalletError properties
      // are serialized into JsonRpcError.data
      const errorCode = extractHardwareWalletErrorCode(error);

      console.log(LOG_TAG, 'Extracted error code:', errorCode);

      if (errorCode) {
        // Emit appropriate device events based on the error code for UI state updates
        if (
          errorCode === ErrorCode.AUTH_LOCK_001 ||
          errorCode === ErrorCode.AUTH_LOCK_002
        ) {
          console.log(LOG_TAG, 'Emitting DEVICE_LOCKED event');
          this.options.onDeviceEvent({
            event: DeviceEvent.DeviceLocked,
            error: error as unknown as Error,
          });
        } else if (errorCode === ErrorCode.DEVICE_STATE_003) {
          console.log(LOG_TAG, 'Emitting DISCONNECTED event');
          this.options.onDeviceEvent({
            event: DeviceEvent.Disconnected,
            error: error as unknown as Error,
          });
        } else {
          // Catch-all for other errors
          console.log(LOG_TAG, 'Emitting DISCONNECTED event (catch-all)');
          this.options.onDeviceEvent({
            event: DeviceEvent.Disconnected,
            error: error as unknown as Error,
          });
        }
      }

      // Reconstruct the HardwareWalletError before re-throwing
      // This ensures consumers of this error get a proper HardwareWalletError instance
      const hwError = reconstructHardwareWalletError(
        error,
        HardwareWalletType.Trezor,
      );

      console.log(LOG_TAG, 'Re-throwing reconstructed error:', {
        code: hwError.code,
        userActionable: hwError.userActionable,
      });

      throw hwError;
    }
  }
}
