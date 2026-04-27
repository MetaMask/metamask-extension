import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
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
} from '../webConnectionUtils';
import {
  getMissingCapabilities,
  isTrezorModelOne,
  isTrezorModelUsingTrezorSuite,
} from './trezorUtils';

const TREZOR_MODEL_ONE_MAX_MESSAGE_BYTES = 1024;

const CONNECTION_RESET_ERROR_CODES: ReadonlySet<ErrorCode> = new Set([
  ErrorCode.DeviceDisconnected,
  ErrorCode.ConnectionClosed,
]);

type TrezorFeaturesPayload = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  session_id: string | null;
  model: string;
  initialized: boolean;
  capabilities: string[];
  unlocked: boolean;
};

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
   * Verify the device is ready for operations.
   *
   * Note: Unlike Ledger, Trezor doesn't require checking for a specific app being open.
   * The device just needs to be connected and unlocked, which is verified during signing operations.
   *
   * @param options - Optional preflight checks (e.g. message size limits)
   * @returns true if device is ready
   */
  async ensureDeviceReady(
    options?: EnsureDeviceReadyOptions,
  ): Promise<boolean> {
    if (!this.isConnected()) {
      await this.connect();
    }

    try {
      const payload = await this.#fetchDeviceFeatures();
      this.#validateDeviceState(payload);
      this.#validateCapabilities(payload.capabilities, payload.model);
      this.#validateModelOneMessageSize(payload.model, options);
      return true;
    } catch (error) {
      this.#handleDeviceReadyError(error);
      throw error instanceof HardwareWalletError
        ? error
        : toHardwareWalletError(error, HardwareWalletType.Trezor);
    }
  }

  /**
   * Fetch the device feature payload from the Trezor Connect session.
   *
   * @returns Normalized feature payload (model, sessionId, capabilities, etc.)
   */
  async #fetchDeviceFeatures(): Promise<TrezorFeaturesPayload> {
    const features = await getTrezorFeatures();
    return features.payload;
  }

  /**
   * Validate unlocked, initialized, and session state from device features.
   *
   * @param payload - The device feature payload to validate
   */
  #validateDeviceState(payload: TrezorFeaturesPayload): void {
    // NOTE: Model one is always locked, it will only become unlocked when performing a transaction.
    if (!payload.unlocked && !isTrezorModelOne(payload.model)) {
      throw createHardwareWalletError(
        ErrorCode.AuthenticationDeviceLocked,
        HardwareWalletType.Trezor,
        'Trezor is not unlocked. Please unlock your device.',
      );
    }

    if (!payload.initialized) {
      throw createHardwareWalletError(
        ErrorCode.DeviceNotReady,
        HardwareWalletType.Trezor,
        'Trezor is not initialized.',
      );
    }

    if (!payload.session_id && !isTrezorModelUsingTrezorSuite(payload.model)) {
      throw createHardwareWalletError(
        ErrorCode.ConnectionClosed,
        HardwareWalletType.Trezor,
        'Trezor session not established. Please reconnect your device.',
      );
    }
  }

  /**
   * Validate that the device reports all required capabilities.
   *
   * @param capabilities - Raw capabilities list from device features
   * @param model - The device model identifier
   */
  #validateCapabilities(capabilities: unknown, model: string): void {
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
   * Validate preflight message size for Trezor Model One devices.
   *
   * @param model - The device model identifier
   * @param options - The ensureDeviceReady options containing preflightMessageBytes
   */
  #validateModelOneMessageSize(
    model: string,
    options?: EnsureDeviceReadyOptions,
  ): void {
    if (
      options?.preflightMessageBytes &&
      isTrezorModelOne(model) &&
      options.preflightMessageBytes > TREZOR_MODEL_ONE_MAX_MESSAGE_BYTES
    ) {
      throw createHardwareWalletError(
        ErrorCode.DeviceMissingCapability,
        HardwareWalletType.Trezor,
        `Trezor Model One does not support signing messages larger than ${TREZOR_MODEL_ONE_MAX_MESSAGE_BYTES} bytes.`,
        { metadata: { preflightMessageBytes: options.preflightMessageBytes } },
      );
    }
  }

  /**
   * Handle errors during ensureDeviceReady by emitting device events
   * and resetting connection state when appropriate.
   *
   * @param error - The error caught during device readiness check
   */
  #handleDeviceReadyError(error: unknown): void {
    const hwError =
      error instanceof HardwareWalletError
        ? error
        : toHardwareWalletError(error, HardwareWalletType.Trezor);

    const deviceEvent = getDeviceEventForError(
      hwError.code,
      DeviceEvent.Disconnected,
    );

    this.options.onDeviceEvent({
      event: deviceEvent,
      error: hwError,
    });

    if (
      CONNECTION_RESET_ERROR_CODES.has(hwError.code) ||
      deviceEvent === DeviceEvent.Disconnected
    ) {
      this.connected = false;
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
