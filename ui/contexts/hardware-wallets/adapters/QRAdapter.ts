import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import { getHdPathForHardwareKeyring } from '../../../store/actions';
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

const LOG_TAG = '[QRAdapter]';

/**
 * QR adapter implementation for QR-based hardware wallets (Keystone, AirGap, etc.)
 * These wallets use QR codes for communication with an air-gapped device.
 * No physical USB/WebHID connection is required - synchronization happens via QR scanning.
 */
export class QRAdapter implements HardwareWalletAdapter {
  private options: HardwareWalletAdapterOptions;

  private connected = false;

  private pendingOperation = false;

  private currentDeviceId: string | null = null;

  private synced = false;

  constructor(options: HardwareWalletAdapterOptions) {
    this.options = options;
  }

  private async getHdPath(): Promise<string> {
    const path = await getHdPathForHardwareKeyring(HardwareDeviceNames.qr);
    console.log(LOG_TAG, 'HD path:', path);
    return path;
  }

  /**
   * Connect to QR hardware wallet
   * For QR wallets, "connection" means establishing the QR sync relationship
   *
   * @param deviceId - The device ID to connect to (QR wallet identifier)
   */
  async connect(deviceId: string): Promise<void> {
    console.log(LOG_TAG, 'Connecting to QR device:', deviceId);

    try {
      // For QR wallets, connection is established through QR code scanning
      // which happens in the UI flow. Here we just mark as connected.
      this.connected = true;
      this.currentDeviceId = deviceId;
      this.synced = false;

      console.log(LOG_TAG, 'QR device connected, awaiting sync');
    } catch (error) {
      console.error(LOG_TAG, 'Connection error:', error);

      // Clean up on error
      this.connected = false;
      this.currentDeviceId = null;
      this.synced = false;

      // Extract the error code
      const errorCode = extractHardwareWalletErrorCode(error);

      if (errorCode) {
        // Call appropriate callbacks based on error code
        if (errorCode === ErrorCode.USER_CANCEL_001) {
          this.options.onDeviceEvent({
            event: DeviceEvent.ConnectionFailed,
            error: error as unknown as Error,
          });
        }
      }

      // Reconstruct and re-throw as a proper HardwareWalletError
      const hwError = reconstructHardwareWalletError(
        error,
        HardwareWalletType.Qr,
      );
      throw hwError;
    }
  }

  /**
   * Disconnect from QR hardware wallet
   */
  async disconnect(): Promise<void> {
    console.log(LOG_TAG, 'Disconnecting');

    try {
      this.connected = false;
      this.currentDeviceId = null;
      this.synced = false;

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
   * Check if device is synced (QR code scanned and accounts loaded)
   */
  isSynced(): boolean {
    return this.synced;
  }

  /**
   * Mark the device as synced after successful QR code scan
   */
  markSynced(): void {
    this.synced = true;
    console.log(LOG_TAG, 'Device marked as synced');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    console.log(LOG_TAG, 'Destroying adapter');

    this.connected = false;
    this.currentDeviceId = null;
    this.pendingOperation = false;
    this.synced = false;
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
   * For QR wallets, this means verifying that:
   * 1. The wallet is connected
   * 2. The initial QR sync has been completed
   *
   * @param deviceId - The device ID to verify
   * @returns true if device is ready
   */
  async verifyDeviceReady(deviceId: string): Promise<boolean> {
    console.log(LOG_TAG, 'Verifying device ready:', deviceId);

    // Step 1: Check if connected
    if (!this.isConnected()) {
      try {
        await this.connect(deviceId);
      } catch (error) {
        throw createHardwareWalletError(
          ErrorCode.DEVICE_STATE_003,
          HardwareWalletType.Qr,
          error instanceof Error ? error.message : 'Unknown error',
          {
            cause: error instanceof Error ? error : undefined,
          },
        );
      }
    }

    // Step 2: Check if synced
    // For QR wallets, being "ready" means the initial QR sync is complete
    // The UI handles the QR scanning process, so if we're here and not synced,
    // we need to prompt for QR sync
    if (!this.isSynced()) {
      console.log(LOG_TAG, 'Device not synced, prompting for QR scan');

      // Emit an event to trigger QR scanning in the UI
      this.options.onDeviceEvent({
        event: DeviceEvent.ConnectionFailed,
        error: new Error('QR sync required'),
      });

      throw createHardwareWalletError(
        ErrorCode.DEVICE_STATE_001,
        HardwareWalletType.Qr,
        'Please scan the QR code from your hardware wallet to sync',
      );
    }

    console.log(LOG_TAG, 'Device is ready');
    return true;
  }

  /**
   * Get the current device ID
   */
  getDeviceId(): string | null {
    return this.currentDeviceId;
  }
}
