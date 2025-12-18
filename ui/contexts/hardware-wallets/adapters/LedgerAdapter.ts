import {
  HardwareDeviceNames,
  LEDGER_USB_VENDOR_ID,
} from '../../../../shared/constants/hardware-wallets';
import {
  attemptLedgerTransportCreation,
  getHdPathForHardwareKeyring,
  getLedgerAppNameAndVersion,
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

const LOG_TAG = '[LedgerAdapter]';

/**
 * Ledger adapter implementation
 * Verifies WebHID device presence AND ensures Ethereum app is open.
 * Actual signing operations happen through MetaMask's normal flow via KeyringController.
 */
export class LedgerAdapter implements HardwareWalletAdapter {
  private options: HardwareWalletAdapterOptions;

  private connected = false;

  private pendingOperation = false;

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

  private async getHdPath(): Promise<string> {
    const path = await getHdPathForHardwareKeyring(HardwareDeviceNames.ledger);
    console.log(LOG_TAG, 'Hd path:', path);
    return path;
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
          ErrorCode.CONN_TRANSPORT_001,
          HardwareWalletType.LEDGER,
          'WebHID is not available',
        );
      }

      // Step 2: Check if device is physically connected
      const isDeviceConnected = await this.checkDeviceConnected();
      if (!isDeviceConnected) {
        throw createHardwareWalletError(
          ErrorCode.DEVICE_STATE_003,
          HardwareWalletType.LEDGER,
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

      // Extract the error code from the JsonRpcError
      const errorCode = extractHardwareWalletErrorCode(error);

      if (errorCode) {
        // Call appropriate callbacks based on error code
        if (
          errorCode === ErrorCode.AUTH_LOCK_001 ||
          errorCode === ErrorCode.AUTH_LOCK_002
        ) {
          this.options.onDeviceLocked();
        } else if (errorCode === ErrorCode.DEVICE_STATE_001) {
          this.options.onAppNotOpen();
        }
      }

      // Reconstruct and re-throw as a proper HardwareWalletError
      const hwError = reconstructHardwareWalletError(
        error,
        HardwareWalletType.LEDGER,
      );
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
        event: DeviceEvent.DISCONNECTED,
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
   * Get current app name (verify Ethereum app is open)
   * Re-checks connectivity with the device
   */
  async getCurrentAppName(): Promise<string> {
    if (!this.isConnected()) {
      throw createHardwareWalletError(
        ErrorCode.DEVICE_STATE_003,
        HardwareWalletType.LEDGER,
        'Device not connected',
      );
    }

    return (await attemptLedgerTransportCreation()) as string;
  }

  /**
   * Verify the device is ready for operations (Ethereum app is open)
   * Throws HardwareWalletError from the KeyringController/Ledger keyring
   * These errors are already properly formatted and include all necessary metadata
   */
  async verifyDeviceReady(): Promise<boolean> {
    if (!this.isConnected()) {
      throw createHardwareWalletError(
        ErrorCode.DEVICE_STATE_003,
        HardwareWalletType.LEDGER,
        'Device not connected',
      );
    }

    try {
      // attemptLedgerTransportCreation calls keyring.attemptMakeApp()
      // which throws native HardwareWalletError instances from @metamask/keyring-utils
      // These errors already have proper codes like AUTH_LOCK_001, DEVICE_STATE_001, etc.
      console.log(LOG_TAG, 'Calling attemptLedgerTransportCreation');
      const result = await attemptLedgerTransportCreation();
      console.log(LOG_TAG, 'Result:', result);

      // Get the app name and version from the Ledger device
      const appInfo = await getLedgerAppNameAndVersion();
      console.log(LOG_TAG, 'Ledger app info:', appInfo);

      // If successful, device is ready with Ethereum app open
      console.log(LOG_TAG, 'Device ready verified successfully');
      return Boolean(result);
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
            event: DeviceEvent.DEVICE_LOCKED,
            error: error as unknown as Error,
          });
        } else if (errorCode === ErrorCode.DEVICE_STATE_001) {
          console.log(LOG_TAG, 'Emitting APP_NOT_OPEN event');
          this.options.onDeviceEvent({
            event: DeviceEvent.APP_NOT_OPEN,
            error: error as unknown as Error,
          });
        } else if (errorCode === ErrorCode.DEVICE_STATE_003) {
          console.log(LOG_TAG, 'Emitting DISCONNECTED event');
          this.options.onDeviceEvent({
            event: DeviceEvent.DISCONNECTED,
            error: error as unknown as Error,
          });
        }
      }

      // Reconstruct the HardwareWalletError before re-throwing
      // This ensures consumers of this error get a proper HardwareWalletError instance
      const hwError = reconstructHardwareWalletError(
        error,
        HardwareWalletType.LEDGER,
      );

      console.log(LOG_TAG, 'Re-throwing reconstructed error:', {
        code: hwError.code,
        userActionable: hwError.userActionable,
      });

      throw hwError;
    }
  }
}
