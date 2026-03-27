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

const TREZOR_MODEL_ONE_MAX_MESSAGE_BYTES = 1024;
const REQUIRED_TREZOR_CAPABILITIES = [
  'Capability_Bitcoin',
  'Capability_Solana',
  'Capability_Ethereum',
] as const;
type RequiredTrezorCapability = (typeof REQUIRED_TREZOR_CAPABILITIES)[number];

const TREZOR_MODELS_USING_TREZOR_SUITE = ['safe 7'];

const isTrezorModelUsingTrezorSuite = (model: string): boolean => {
  const normalizedModel = model.toLowerCase();
  return TREZOR_MODELS_USING_TREZOR_SUITE.includes(normalizedModel);
};

/**
 * Trezor adapter implementation
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
   * Connect to Trezor device
   * Verifies device is physically connected via WebUSB
   *
   */
  async connect(): Promise<void> {
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
      const isDeviceConnected = await this.checkDeviceConnected();
      if (!isDeviceConnected) {
        throw createHardwareWalletError(
          ErrorCode.DeviceDisconnected,
          HardwareWalletType.Trezor,
          'Trezor device not found. Please connect your Trezor device.',
        );
      }

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
    }
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
      // Check if the Trezor Connect session has been established.
      // This doesn't open a popup - it just checks internal session state.
      // The actual PIN/passphrase prompts happen during signing operations.
      const features = await getTrezorFeatures();
      const {
        payload: {
          session_id: sessionId,
          model,
          initialized,
          capabilities,
          unlocked,
        },
      } = features;

      // For Trezor 5 and below, the usb will not be active until it is unlocked.
      if (!unlocked) {
        throw createHardwareWalletError(
          ErrorCode.AuthenticationDeviceLocked,
          HardwareWalletType.Trezor,
          'Trezor is not unlocked. Please unlock your device.',
        );
      }

      if (!initialized) {
        throw createHardwareWalletError(
          ErrorCode.DeviceNotReady,
          HardwareWalletType.Trezor,
          'Trezor is not initialized.',
        );
      }

      // For model 7 and above popups are not used, therefore session is null
      // Check if session exists (indicates Trezor Connect is initialized)
      if (!sessionId && !isTrezorModelUsingTrezorSuite(model)) {
        throw createHardwareWalletError(
          ErrorCode.ConnectionClosed,
          HardwareWalletType.Trezor,
          'Trezor session not established. Please reconnect your device.',
        );
      }

      const missingCapabilities = getMissingCapabilities(
        capabilities,
        REQUIRED_TREZOR_CAPABILITIES,
      );
      if (missingCapabilities.length > 0) {
        throw createHardwareWalletError(
          ErrorCode.DeviceMissingCapability,
          HardwareWalletType.Trezor,
          `Trezor device is missing required capabilities: ${missingCapabilities.join(
            ', ',
          )}.`,
          {
            metadata: {
              capabilities,
              missingCapabilities,
            },
          },
        );
      }

      if (
        options?.preflightMessageBytes &&
        isTrezorModelOne(model) &&
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
        }

        throw error;
      }

      // Convert unknown errors to HardwareWalletError
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
      if (deviceEvent === DeviceEvent.Disconnected) {
        this.connected = false;
      }

      throw hwError;
    }
  }
}

function getMissingCapabilities(
  capabilities: unknown,
  requiredCapabilities: readonly RequiredTrezorCapability[],
): RequiredTrezorCapability[] {
  const capabilitiesSet = new Set(
    Array.isArray(capabilities)
      ? capabilities.filter(
          (capability): capability is RequiredTrezorCapability =>
            typeof capability === 'string',
        )
      : [],
  );

  return requiredCapabilities.filter(
    (requiredCapability) => !capabilitiesSet.has(requiredCapability),
  );
}

function isTrezorModelOne(model: unknown): boolean {
  if (typeof model !== 'string') {
    return false;
  }

  const normalizedModel = model.toLowerCase();
  return (
    normalizedModel === '1' ||
    normalizedModel === 't1b1' ||
    normalizedModel.includes('model one')
  );
}
