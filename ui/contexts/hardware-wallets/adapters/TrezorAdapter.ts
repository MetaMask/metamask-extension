import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { getTrezorFeatures } from '../../../store/actions';
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
  getConnectedTrezorDevices,
  isWebUsbAvailable,
  subscribeToWebUsbEvents,
} from '../webConnectionUtils';

const TREZOR_MODEL_ONE_MAX_MESSAGE_BYTES = 1024;

/**
 * Trezor adapter implementation
 * Verifies WebUSB device presence for Trezor hardware wallets.
 * Actual signing operations happen through MetaMask's normal flow via KeyringController.
 */
export class TrezorAdapter implements HardwareWalletAdapter {
  private options: HardwareWalletAdapterOptions;

  private connected = false;

  private isConnecting = false;

  private pendingConnection: Promise<void> | null = null;

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
   * Check if device is currently connected via WebUSB
   */
  private async checkDeviceConnected(): Promise<USBDevice | undefined> {
    const devices = await getConnectedTrezorDevices();
    return devices.length > 0 ? devices[0] : undefined;
  }

  /**
   * Connect to Trezor device
   * Verifies device is physically connected via WebUSB
   *
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    if (this.isConnecting && this.pendingConnection) {
      try {
        await this.pendingConnection;
      } catch {
        // Ignore pending connection errors and continue with a fresh attempt.
      }

      if (this.connected) {
        return;
      }
    }

    this.isConnecting = true;
    this.pendingConnection = (async () => {
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
        const connectedDevice = await this.checkDeviceConnected();
        if (!connectedDevice) {
          throw createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            HardwareWalletType.Trezor,
            'Trezor device not found. Please connect your Trezor device.',
          );
        }

        // Mark as connected - device is present
        this.connected = true;
      } catch (error) {
        // Clean up on error
        this.connected = false;

        const hwError = toHardwareWalletError(error, HardwareWalletType.Trezor);
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
   * Disconnect from Trezor device
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
    // Unsubscribe from WebUSB events
    this.unsubscribeUsbEvents?.();
    this.unsubscribeUsbEvents = null;

    this.connected = false;
    this.isConnecting = false;
    this.pendingConnection = null;
  }

  /**
   * Verify the device is ready for operations
   * Throws HardwareWalletError from the KeyringController/Trezor keyring
   * These errors are already properly formatted and include all necessary metadata
   *
   * Note: Unlike Ledger, Trezor doesn't require checking for a specific app being open.
   * The device just needs to be connected and unlocked, which is verified during signing operations.
   *
   * @param options
   * @returns true if device is ready
   */
  async ensureDeviceReady(
    options?: EnsureDeviceReadyOptions,
  ): Promise<boolean> {
    if (!this.isConnected()) {
      await this.connect();
    }

    try {
      const connectedDevice = await this.checkDeviceConnected();
      if (!connectedDevice) {
        throw createHardwareWalletError(
          ErrorCode.DeviceDisconnected,
          HardwareWalletType.Trezor,
          'Trezor device disconnected. Please reconnect your device.',
        );
      }

      const featuresResponse = await getTrezorFeatures();

      if (!featuresResponse.success) {
        throw createHardwareWalletError(
          ErrorCode.ConnectionClosed,
          HardwareWalletType.Trezor,
          'Unable to read Trezor status. Please reconnect your device.',
        );
      }

      if (featuresResponse.payload.initialized === false) {
        throw createHardwareWalletError(
          ErrorCode.DeviceNotReady,
          HardwareWalletType.Trezor,
          'Trezor device is not initialized. Please complete device setup and try again.',
        );
      }

      if (featuresResponse.payload.unlocked === false) {
        throw createHardwareWalletError(
          ErrorCode.AuthenticationDeviceLocked,
          HardwareWalletType.Trezor,
          'Trezor device is locked. Please unlock your device.',
        );
      }

      if (
        options?.preflightMessageBytes &&
        isTrezorModelOne(featuresResponse.payload.model, connectedDevice) &&
        options.preflightMessageBytes > TREZOR_MODEL_ONE_MAX_MESSAGE_BYTES
      ) {
        throw createHardwareWalletError(
          ErrorCode.DeviceMissingCapability,
          HardwareWalletType.Trezor,
          `Trezor Model One does not support signing messages larger than ${TREZOR_MODEL_ONE_MAX_MESSAGE_BYTES} bytes.`,
          {
            metadata: {
              preflightMessageBytes: options.preflightMessageBytes,
            },
          },
        );
      }

      return true;
    } catch (error) {
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

function isTrezorModelOne(model: unknown, connectedDevice: USBDevice): boolean {
  const candidateModel =
    typeof model === 'string' && model
      ? model
      : typeof connectedDevice.productName === 'string'
        ? connectedDevice.productName
        : '';

  if (!candidateModel) {
    return false;
  }

  const normalizedModel = candidateModel.toLowerCase();
  return (
    normalizedModel === '1' ||
    normalizedModel === 't1b1' ||
    normalizedModel.includes('trezor one') ||
    normalizedModel.includes('model one')
  );
}
