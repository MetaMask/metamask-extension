import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { LEDGER_USB_VENDOR_ID } from '../../../../shared/constants/hardware-wallets';
import {
  attemptLedgerTransportCreation,
  getAppNameAndVersion,
} from '../../../store/actions';
import { createHardwareWalletError, getDeviceEventForError } from '../errors';
import {
  DeviceEvent,
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';
import { reconstructHardwareWalletError } from '../rpcErrorUtils';

/**
 * Ledger adapter implementation
 * Verifies WebHID device presence AND ensures Ethereum app is open.
 * Actual signing operations happen through MetaMask's normal flow via KeyringController.
 */
export class LedgerAdapter implements HardwareWalletAdapter {
  private options: HardwareWalletAdapterOptions;

  private connected = false;

  private isConnecting = false;

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
    // Already connected or connection in progress - skip
    if (this.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

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
