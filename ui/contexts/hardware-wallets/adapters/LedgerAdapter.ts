import { ErrorCode } from '@metamask/hw-wallet-sdk';
import {
  attemptLedgerTransportCreation,
  getAppNameAndVersion,
  getHdPathForLedgerKeyring,
  getLedgerAppConfiguration,
  getLedgerPublicKey,
} from '../../../store/actions';
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
  getConnectedLedgerDevices,
  isWebHidAvailable,
} from '../webConnectionUtils';

/**
 * Ledger adapter implementation
 * Verifies WebHID device presence AND ensures Ethereum app is open.
 * Actual signing operations happen through MetaMask's normal flow via KeyringController.
 */
export class LedgerAdapter implements HardwareWalletAdapter {
  private options: HardwareWalletAdapterOptions;

  private connected = false;

  private isConnecting = false;

  private pendingConnection: Promise<void> | null = null;

  constructor(options: HardwareWalletAdapterOptions) {
    this.options = options;
  }

  /**
   * Check if device is currently connected via WebHID
   */
  private async checkDeviceConnected(): Promise<HIDDevice | undefined> {
    const devices = await getConnectedLedgerDevices();
    // We only use the first ledger device for
    return devices.length > 0 ? devices[0] : undefined;
  }

  private async getHdPath(): Promise<string> {
    const path = await getHdPathForLedgerKeyring();
    return path;
  }

  /**
   * Connect to Ledger device
   * Verifies device is physically connected AND Ethereum app is open
   *
   */
  async connect(): Promise<void> {
    console.debug(
      '[LedgerAdapter] connect() called',
      JSON.stringify(
        {
          connected: this.connected,
          isConnecting: this.isConnecting,
          hasPendingConnection: this.pendingConnection !== null,
        },
        null,
        '\t',
      ),
    );

    // Already connected to the same device - return immediately
    if (this.connected) {
      console.debug(
        '[LedgerAdapter] connect() — already connected, returning early',
      );
      return;
    }

    // Connection in progress - check if it's for the same device
    if (this.isConnecting && this.pendingConnection) {
      console.debug(
        '[LedgerAdapter] connect() — connection already in progress, waiting for pending connection',
      );
      // Connecting to a different device - wait for current connection to complete/fail,
      // then disconnect and connect to the new device
      try {
        await this.pendingConnection;
      } catch (error) {
        console.debug(
          '[LedgerAdapter] connect() — pending connection failed, will retry',
          JSON.stringify(
            {
              errorMessage:
                error instanceof Error ? error.message : String(error),
            },
            null,
            '\t',
          ),
        );
        // Ignore errors from the pending connection - we'll try to connect to the new device
      }
      // If we got here, the previous connection completed or failed
      // Disconnect if connected and try to connect to the new device
      if (this.connected) {
        console.debug(
          '[LedgerAdapter] connect() — disconnecting before retrying new connection',
        );
        await this.disconnect();
      }
    }

    // Start new connection - track the device we're connecting to
    this.isConnecting = true;
    console.debug('[LedgerAdapter] connect() — starting new connection');
    this.pendingConnection = (async () => {
      try {
        // Step 1: Check WebHID availability
        console.debug(
          '[LedgerAdapter] connect() Step 1: Checking WebHID availability...',
        );
        const webHidAvailable = isWebHidAvailable();
        console.debug(
          '[LedgerAdapter] connect() Step 1: WebHID availability result',
          JSON.stringify(
            {
              webHidAvailable,
            },
            null,
            '\t',
          ),
        );
        if (!webHidAvailable) {
          throw createHardwareWalletError(
            ErrorCode.ConnectionTransportMissing,
            HardwareWalletType.Ledger,
            'WebHID is not available',
          );
        }

        // Step 2: Check if device is physically connected
        console.debug(
          '[LedgerAdapter] connect() Step 2: Checking for physically connected Ledger device...',
        );
        const connectedLedgerDevice = await this.checkDeviceConnected();
        console.debug(
          '[LedgerAdapter] connect() Step 2: Device check result',
          JSON.stringify(
            {
              deviceFound: Boolean(connectedLedgerDevice),
              deviceInfo: connectedLedgerDevice
                ? {
                    productName: connectedLedgerDevice.productName,
                    vendorId: connectedLedgerDevice.vendorId,
                    productId: connectedLedgerDevice.productId,
                    opened: connectedLedgerDevice.opened,
                  }
                : null,
            },
            null,
            '\t',
          ),
        );
        if (!connectedLedgerDevice) {
          throw createHardwareWalletError(
            ErrorCode.DeviceDisconnected,
            HardwareWalletType.Ledger,
            'Ledger device not found. Please connect your Ledger device.',
          );
        }

        // Step 3: Check if device is unlocked. This is only for Nano S and Nano X because there
        // is no way to detect if the device is locked on Nano S Plus without attempting an action.
        // This is a hack. Any errors would show device is locked when that might not be true.
        const productName = connectedLedgerDevice.productName ?? '';
        console.debug(
          '[LedgerAdapter] connect() Step 3: Checking device unlock status',
          JSON.stringify(
            {
              productName,
              requiresUnlockCheck: ['Nano S', 'Nano X', 'Nano S Plus'].includes(
                productName,
              ),
            },
            null,
            '\t',
          ),
        );
        if (['Nano S', 'Nano X', 'Nano S Plus'].includes(productName)) {
          const hdPath = await this.getHdPath();
          console.debug(
            '[LedgerAdapter] connect() Step 3: Got HD path, requesting public key',
            JSON.stringify(
              {
                hdPath,
              },
              null,
              '\t',
            ),
          );
          await getLedgerPublicKey(hdPath);
          console.debug(
            '[LedgerAdapter] connect() Step 3: Public key request succeeded — device is unlocked',
          );
        }

        // Step 4: Attempt to create a transport for the device
        console.debug(
          '[LedgerAdapter] connect() Step 4: Attempting Ledger transport creation...',
        );
        await attemptLedgerTransportCreation();
        console.debug(
          '[LedgerAdapter] connect() Step 4: Transport creation succeeded',
        );

        // Mark as connected - device is present AND app is open
        this.connected = true;

        console.debug(
          '[LedgerAdapter] connect() — connection complete',
          JSON.stringify(
            {
              connected: this.connected,
              isConnecting: this.isConnecting,
            },
            null,
            '\t',
          ),
        );
      } catch (error) {
        // Clean up on error
        this.connected = false;

        const hwError = toHardwareWalletError(error, HardwareWalletType.Ledger);
        console.error(
          '[LedgerAdapter] connect() — connection failed',
          JSON.stringify(
            {
              errorCode: hwError.code,
              errorMessage: hwError.message,
              errorSeverity: hwError.severity,
              errorCategory: hwError.category,
              errorUserMessage: hwError.userMessage,
              errorMetadata: hwError.metadata,
              originalErrorType: error?.constructor?.name,
              originalErrorMessage:
                error instanceof Error ? error.message : String(error),
            },
            null,
            '\t',
          ),
        );

        const deviceEvent = getDeviceEventForError(hwError.code);

        this.options.onDeviceEvent({
          event: deviceEvent,
          error: hwError,
        });

        throw hwError;
      } finally {
        this.isConnecting = false;
        this.pendingConnection = null;
        console.debug(
          '[LedgerAdapter] connect() — connection attempt finished (finally)',
          JSON.stringify(
            {
              connected: this.connected,
              isConnecting: this.isConnecting,
              hasPendingConnection: this.pendingConnection !== null,
            },
            null,
            '\t',
          ),
        );
      }
    })();

    return this.pendingConnection;
  }

  /**
   * Disconnect from Ledger device
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
    // The offscreen ledger script cleans up the transport after each action.
    // See closeTransport() in app/offscreen/ledger.ts
    this.connected = false;
    this.isConnecting = false;
    // TODO: Potential race conditon: Destroy may override pending connection before it resolves.
    this.pendingConnection = null;
  }

  /**
   * Verify the device is ready for operations (Ethereum app is open)
   * Throws HardwareWalletError from the KeyringController/Ledger keyring
   * These errors are already properly formatted and include all necessary metadata
   *
   * @param options - Optional settings to control readiness checks
   * @param options.requireBlindSigning - Whether to check if blind signing is enabled
   * on the Ledger device. Defaults to true. Set to false for simple sends (plain
   * native asset transfers) that don't involve contract interactions.
   * @returns true if device is ready
   */
  async ensureDeviceReady(
    options?: EnsureDeviceReadyOptions,
  ): Promise<boolean> {
    const { requireBlindSigning = true } = options ?? {};

    console.debug(
      '[LedgerAdapter] ensureDeviceReady() called',
      JSON.stringify(
        {
          options: options ?? {},
          requireBlindSigning,
          isConnected: this.isConnected(),
          connected: this.connected,
        },
        null,
        '\t',
      ),
    );

    if (!this.isConnected()) {
      console.debug(
        '[LedgerAdapter] ensureDeviceReady() — not connected, calling connect() first',
      );
      await this.connect();
      console.debug(
        '[LedgerAdapter] ensureDeviceReady() — connect() completed, now connected:',
        this.connected,
      );
    }

    try {
      // Get the app name and version from the Ledger device
      console.debug(
        '[LedgerAdapter] ensureDeviceReady() — getting app name and version...',
      );
      const appInfo = await getAppNameAndVersion();
      console.debug(
        '[LedgerAdapter] ensureDeviceReady() — app info received',
        JSON.stringify(
          {
            appName: appInfo.appName,
            appVersion:
              'version' in appInfo
                ? (appInfo as Record<string, unknown>).version
                : undefined,
            fullAppInfo: appInfo,
          },
          null,
          '\t',
        ),
      );
      if (appInfo.appName !== 'Ethereum') {
        console.warn(
          '[LedgerAdapter] ensureDeviceReady() — Ethereum app is NOT open',
          JSON.stringify(
            {
              expectedAppName: 'Ethereum',
              actualAppName: appInfo.appName,
            },
            null,
            '\t',
          ),
        );
        throw createHardwareWalletError(
          ErrorCode.DeviceStateEthAppClosed,
          HardwareWalletType.Ledger,
          `Ethereum app is not open, got ${appInfo.appName}`,
        );
      }
      console.debug(
        '[LedgerAdapter] ensureDeviceReady() — Ethereum app confirmed open',
      );

      // Blind signing check: only needed for contract interactions, signatures,
      // and dapp transactions. Simple sends (plain native asset transfers) do not
      // require blind signing since the Ledger can display them natively.
      if (requireBlindSigning) {
        console.debug(
          '[LedgerAdapter] ensureDeviceReady() — checking blind signing status...',
        );
        const appConfig = await getLedgerAppConfiguration();
        console.debug(
          '[LedgerAdapter] ensureDeviceReady() — app configuration received',
          JSON.stringify(
            {
              arbitraryDataEnabled: appConfig.arbitraryDataEnabled,
              fullAppConfig: appConfig,
            },
            null,
            '\t',
          ),
        );
        if (appConfig.arbitraryDataEnabled !== 1) {
          console.warn(
            '[LedgerAdapter] ensureDeviceReady() — blind signing is NOT enabled',
            JSON.stringify(
              {
                arbitraryDataEnabled: appConfig.arbitraryDataEnabled,
              },
              null,
              '\t',
            ),
          );
          throw createHardwareWalletError(
            ErrorCode.DeviceStateBlindSignNotSupported,
            HardwareWalletType.Ledger,
            'Blind signing is not enabled',
          );
        }
        console.debug(
          '[LedgerAdapter] ensureDeviceReady() — blind signing is enabled',
        );
      } else {
        console.debug(
          '[LedgerAdapter] ensureDeviceReady() — skipping blind signing check (requireBlindSigning=false)',
        );
      }

      console.debug('[LedgerAdapter] ensureDeviceReady() — device is ready');
      return true;
    } catch (error) {
      const hwError = toHardwareWalletError(error, HardwareWalletType.Ledger);
      console.error(
        '[LedgerAdapter] ensureDeviceReady() — readiness check failed',
        JSON.stringify(
          {
            errorCode: hwError.code,
            errorMessage: hwError.message,
            errorSeverity: hwError.severity,
            errorCategory: hwError.category,
            errorUserMessage: hwError.userMessage,
            errorMetadata: hwError.metadata,
            originalErrorType: error?.constructor?.name,
            originalErrorMessage:
              error instanceof Error ? error.message : String(error),
          },
          null,
          '\t',
        ),
      );
      // Emit appropriate device events with the properly reconstructed error
      const deviceEvent = getDeviceEventForError(
        hwError.code,
        DeviceEvent.Disconnected,
      );
      console.debug(
        '[LedgerAdapter] ensureDeviceReady() — emitting device event',
        JSON.stringify(
          {
            deviceEvent,
            errorCode: hwError.code,
          },
          null,
          '\t',
        ),
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
        console.debug(
          '[LedgerAdapter] ensureDeviceReady() — connection state reset',
          JSON.stringify(
            {
              shouldResetConnection,
              deviceEvent,
              connected: this.connected,
            },
            null,
            '\t',
          ),
        );
      }
      throw hwError;
    }
  }
}
