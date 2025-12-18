import { LEDGER_USB_VENDOR_ID } from '../../../../shared/constants/hardware-wallets';
import { attemptLedgerTransportCreation } from '../../../store/actions';
import {
  createHardwareWalletError,
  ErrorCode,
  type HardwareWalletError,
} from '../errors';
import {
  DeviceEvent,
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';

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

      // Step 3: Verify Ethereum app is open
      // attemptLedgerTransportCreation calls keyring.attemptMakeApp()
      // which throws native HardwareWalletError instances from @metamask/keyring-utils
      const result = await attemptLedgerTransportCreation();
      console.log(LOG_TAG, 'attemptLedgerTransportCreation result:', result);

      // Mark as connected - device is present AND app is open
      this.connected = true;
      this.currentDeviceId = deviceId;

      console.log(LOG_TAG, 'Device connected and Ethereum app verified');
    } catch (error) {
      console.error(LOG_TAG, 'Connection error:', error);

      // Clean up on error
      this.connected = false;
      this.currentDeviceId = null;

      // The error from keyring is already a HardwareWalletError with proper code
      // Call appropriate callbacks based on error code
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'string'
      ) {
        const errorCode = error.code as ErrorCode;

        if (
          errorCode === ErrorCode.AUTH_LOCK_001 ||
          errorCode === ErrorCode.AUTH_LOCK_002
        ) {
          this.options.onDeviceLocked();
        } else if (errorCode === ErrorCode.DEVICE_STATE_001) {
          this.options.onAppNotOpen();
        }
      }

      // Re-throw the original error from keyring - it's already properly formatted
      throw error;
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
      await attemptLedgerTransportCreation();

      // If successful, device is ready with Ethereum app open
      console.log(LOG_TAG, 'Device ready verified successfully');
      return true;
    } catch (error) {
      console.error(LOG_TAG, 'Error verifying device ready:', error);
      console.log(LOG_TAG, 'Error type:', typeof error);
      console.log(LOG_TAG, 'Error code:', (error as HardwareWalletError)?.code);
      console.log(
        LOG_TAG,
        'Error userActionable:',
        (error as HardwareWalletError)?.userActionable,
      );
      console.log(
        LOG_TAG,
        'Error has code property:',
        'code' in (error as object),
      );

      // The error from keyring is already a HardwareWalletError with proper code
      // Emit appropriate device events based on the error code for UI state updates
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'string'
      ) {
        const errorCode = error.code as ErrorCode;
        console.log(LOG_TAG, 'Mapped error code:', errorCode);

        // Emit events so UI can update connection state
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
          // Device disconnected
          console.log(LOG_TAG, 'Emitting DISCONNECTED event');
          this.options.onDeviceEvent({
            event: DeviceEvent.DISCONNECTED,
            error: error as unknown as Error,
          });
        }
      }

      // Re-throw the original error from keyring - it's already properly formatted
      console.log(LOG_TAG, 'Re-throwing error');
      throw error;
    }
  }
}
