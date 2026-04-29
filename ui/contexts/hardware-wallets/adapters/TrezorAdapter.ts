import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
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
} from '../webConnectionUtils';
import { getMissingCapabilities, isTrezorModelOne } from './trezorUtils';

/**
 * Trezor adapter implementation.
 * Verifies WebUSB device presence for Trezor hardware wallets.
 * Actual signing operations happen through MetaMask's normal flow via KeyringController.
 */
export class TrezorAdapter implements HardwareWalletAdapter {
  private options: HardwareWalletAdapterOptions;

  private connected = false;

  constructor(options: HardwareWalletAdapterOptions) {
    this.options = options;
  }

  /**
   * Check if device is currently connected via WebUSB
   */
  private async checkDeviceConnected(): Promise<boolean> {
    const devices = await getConnectedTrezorDevices();
    return devices.length > 0;
  }

  /**
   * Connect to Trezor device.
   * Verifies WebUSB availability and confirms a physical device is present.
   */
  async connect(): Promise<void> {
    if (!isWebUsbAvailable()) {
      this.#handleConnectionError(
        createHardwareWalletError(
          ErrorCode.ConnectionTransportMissing,
          HardwareWalletType.Trezor,
          'WebUSB is not available',
        ),
      );
    }

    let isDeviceConnected: boolean;
    try {
      isDeviceConnected = await this.checkDeviceConnected();
    } catch (error) {
      this.#handleConnectionError(
        toHardwareWalletError(error, HardwareWalletType.Trezor),
      );
    }

    if (!isDeviceConnected) {
      this.#handleConnectionError(
        createHardwareWalletError(
          ErrorCode.DeviceDisconnected,
          HardwareWalletType.Trezor,
          'Trezor device not found. Please connect your Trezor device.',
        ),
      );
    }

    this.connected = true;
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
    this.connected = false;
  }

  /**
   * Ensure the device is connected and ready for signing operations.
   *
   * This only verifies a USB connection is present. All other device checks
   * (lock state, initialization, session, capabilities) are handled by the
   * Trezor Connect SDK during the actual signing flow.
   *
   * @returns true if the device is connected.
   */
  async ensureDeviceReady(): Promise<boolean> {
    if (!this.isConnected()) {
      await this.connect();
    }

    return true;
  }

  /**
   * Validate that the device reports all required capabilities.
   *
   * @param capabilities - Raw capabilities list from device features
   * @param model - The device model identifier
   */
  validateCapabilities(capabilities: unknown, model: string): void {
    const missing = getMissingCapabilities(capabilities);

    // Trezor Model One does not support Solana, but it must still support
    // the other required capabilities.
    const missingForModel = isTrezorModelOne(model)
      ? missing.filter((capability) => capability !== 'Capability_Solana')
      : missing;

    if (missingForModel.length > 0) {
      throw createHardwareWalletError(
        ErrorCode.DeviceMissingCapability,
        HardwareWalletType.Trezor,
        `Trezor device is missing required capabilities: ${missingForModel.join(
          ', ',
        )}.`,
        { metadata: { capabilities, missingCapabilities: missingForModel } },
      );
    }
  }

  /**
   * Handle a connection error by emitting the appropriate device event
   * and resetting connection state before re-throwing.
   *
   * @param hwError - The hardware wallet error to handle
   */
  #handleConnectionError(hwError: HardwareWalletError): never {
    this.connected = false;

    const deviceEvent = getDeviceEventForError(hwError.code);
    this.options.onDeviceEvent({
      event: deviceEvent,
      error: hwError,
    });

    throw hwError;
  }
}
