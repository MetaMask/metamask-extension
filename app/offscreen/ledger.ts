import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import type Transport from '@ledgerhq/hw-transport';
import LedgerEth from '@ledgerhq/hw-app-eth';
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import { LEDGER_USB_VENDOR_ID } from '../../shared/constants/hardware-wallets';

type EIP712Message = Parameters<LedgerEth['signEIP712Message']>[1];

/**
 * Checks if WebHID API is available in this environment.
 *
 * @returns True if WebHID is supported.
 */
function isWebHIDSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.hid !== 'undefined'
  );
}

/**
 * Serializes an error for transmission across message boundaries.
 * Preserves statusCode for TransportStatusError.
 *
 * @param error - The error to serialize.
 * @returns Serialized error object.
 */
function serializeError(error: unknown): {
  message: string;
  statusCode?: number;
  name?: string;
} {
  if (error instanceof Error) {
    const serialized: { message: string; statusCode?: number; name?: string } =
      {
        message: error.message,
        name: error.name,
      };

    // Preserve statusCode for TransportStatusError
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      serialized.statusCode = error.statusCode;
    }

    return serialized;
  }
  return { message: String(error) };
}

/**
 * Handles Ledger communication in the offscreen document.
 * Manages transport and app state as instance variables.
 */
export class LedgerOffscreenHandler {
  private transport: Transport | null = null;

  private ethApp: LedgerEth | null = null;

  // Prevents concurrent makeApp calls from creating multiple transports
  private pendingMakeApp: Promise<boolean> | null = null;

  /**
   * Attempts to open a transport to an already-permitted Ledger device.
   * This does NOT require a user gesture - it only works for devices
   * that the user has previously granted permission to via requestDevice().
   */
  private async openTransport(): Promise<Transport> {
    if (!isWebHIDSupported()) {
      throw new Error('WebHID is not supported in this browser');
    }

    // First try to open an already-connected device (no gesture needed)
    const existingTransport = await TransportWebHID.openConnected();
    if (existingTransport) {
      return existingTransport;
    }

    // Check if any Ledger devices are permitted
    const devices = await navigator.hid.getDevices();
    const ledgerDevices = devices.filter(
      (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
    );

    if (ledgerDevices.length === 0) {
      const errorMessage =
        'No permitted Ledger device found. User must grant permission from the UI first.';
      throw new HardwareWalletError(errorMessage, {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: errorMessage,
      });
    }

    // Try to create a transport with the permitted device
    // This should work without a gesture since the device is already permitted
    return TransportWebHID.create();
  }

  /**
   * Initializes the Ledger Ethereum app.
   * Creates transport if needed and instantiates LedgerEth.
   */
  private async makeApp(): Promise<boolean> {
    // If already initializing, wait for that to complete
    if (this.pendingMakeApp) {
      return this.pendingMakeApp;
    }

    this.pendingMakeApp = (async () => {
      try {
        // If we already have a working app, verify it's still connected
        if (this.transport && this.ethApp) {
          try {
            // Quick test to see if device is still responsive
            await this.ethApp.getAppConfiguration();
            return true;
          } catch {
            // Device disconnected, clean up and reconnect
            await this.closeTransport();
          }
        }

        this.transport = await this.openTransport();
        this.ethApp = new LedgerEth(this.transport);
        return true;
      } catch (error) {
        console.error('Ledger makeApp error:', error);
        throw error;
      } finally {
        this.pendingMakeApp = null;
      }
    })();

    return this.pendingMakeApp;
  }

  /**
   * Closes the transport and cleans up state.
   * Clears state synchronously first to prevent races with reconnection.
   */
  private async closeTransport(): Promise<void> {
    const transportToClose = this.transport;
    this.transport = null;
    this.ethApp = null;

    if (transportToClose) {
      try {
        await transportToClose.close();
      } catch {
        // Ignore close errors
      }
    }
  }

  /**
   * Ensures the app is ready for operations.
   * Throws if no app is available.
   */
  private async ensureApp(): Promise<LedgerEth> {
    if (!this.ethApp) {
      await this.makeApp();
    }
    if (!this.ethApp) {
      throw new Error('Ledger app not initialized');
    }
    return this.ethApp;
  }

  /**
   * Gets the public key for a given HD path.
   *
   * @param hdPath - The HD derivation path.
   * @returns Public key, address, and optional chain code.
   */
  private async getPublicKey(hdPath: string): Promise<{
    publicKey: string;
    address: string;
    chainCode?: string;
  }> {
    const app = await this.ensureApp();
    const result = await app.getAddress(hdPath, false, true);
    return {
      publicKey: result.publicKey,
      address: result.address,
      chainCode: result.chainCode,
    };
  }

  /**
   * Signs a transaction using clear signing, which displays human-readable
   * token/NFT information on the Ledger device screen.
   *
   * @param hdPath - The HD derivation path.
   * @param tx - The raw transaction hex string.
   * @returns Signature components v, r, s.
   */
  private async signTransaction(
    hdPath: string,
    tx: string,
  ): Promise<{
    v: string;
    r: string;
    s: string;
  }> {
    const app = await this.ensureApp();
    const result = await app.clearSignTransaction(hdPath, tx, {
      nft: true,
      externalPlugins: true,
      erc20: true,
    });
    return {
      v: result.v,
      r: result.r,
      s: result.s,
    };
  }

  /**
   * Signs a personal message.
   *
   * @param hdPath - The HD derivation path.
   * @param message - The message hex string to sign.
   * @returns Signature components v, r, s.
   */
  private async signPersonalMessage(
    hdPath: string,
    message: string,
  ): Promise<{
    v: number;
    r: string;
    s: string;
  }> {
    const app = await this.ensureApp();
    // Remove 0x prefix if present
    const messageHex = message.startsWith('0x') ? message.slice(2) : message;
    const result = await app.signPersonalMessage(hdPath, messageHex);
    return {
      v: result.v,
      r: result.r,
      s: result.s,
    };
  }

  /**
   * Signs EIP-712 typed data using clear signing.
   * Uses signEIP712Message which accepts the full typed data structure,
   * allowing the Ledger device to display human-readable message contents.
   *
   * Note: This method is not compatible with Ledger Nano S, which only supports
   * signEIP712HashedMessage (blind signing). Ledger officially deprecated
   * Nano S software support in 2025, so no fallback is implemented.
   *
   * @param params - The signing parameters.
   * @param params.hdPath - The HD derivation path.
   * @param params.message - The EIP-712 typed data message.
   * @param params.message.domain - The EIP-712 domain.
   * @param params.message.types - The EIP-712 types.
   * @param params.message.primaryType - The primary type name.
   * @param params.message.message - The message data.
   * @returns Signature components v, r, s.
   */
  private async signTypedData(params: {
    hdPath: string;
    message: {
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
    };
  }): Promise<{
    v: number;
    r: string;
    s: string;
  }> {
    const app = await this.ensureApp();
    const result = await app.signEIP712Message(
      params.hdPath,
      params.message as EIP712Message,
    );
    return {
      v: result.v,
      r: result.r,
      s: result.s,
    };
  }

  /**
   * Sets up HID device event listeners for connect/disconnect events.
   */
  private setupDeviceEventListeners(): void {
    if (!isWebHIDSupported()) {
      console.warn('WebHID not supported, skipping device event listeners');
      return;
    }

    navigator.hid.addEventListener('connect', ({ device }) => {
      if (device.vendorId === Number(LEDGER_USB_VENDOR_ID)) {
        chrome.runtime.sendMessage({
          target: OffscreenCommunicationTarget.extension,
          event: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: true,
        });
      }
    });

    navigator.hid.addEventListener('disconnect', ({ device }) => {
      if (device.vendorId === Number(LEDGER_USB_VENDOR_ID)) {
        // Clean up transport state on disconnect
        this.closeTransport();

        chrome.runtime.sendMessage({
          target: OffscreenCommunicationTarget.extension,
          event: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: false,
        });
      }
    });
  }

  /**
   * Sets up the message listener for handling Ledger actions from the offscreen bridge.
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener(
      (
        msg: {
          target: string;
          action: LedgerAction;
          params?: Record<string, unknown>;
        },
        _sender,
        sendResponse,
      ) => {
        if (msg.target !== OffscreenCommunicationTarget.ledgerOffscreen) {
          return false;
        }

        // Handle the action asynchronously
        this.handleLedgerAction(msg.action, msg.params)
          .then((result) => {
            sendResponse({
              success: true,
              payload: result,
            });
          })
          .catch((error) => {
            console.error(`Ledger action ${msg.action} failed:`, error);
            sendResponse({
              success: false,
              payload: {
                error: serializeError(error),
              },
            });
          })
          .finally(() => {
            this.closeTransport();
          });

        // Return true to indicate we will send response asynchronously
        return true;
      },
    );
  }

  /**
   * Handles a Ledger action and returns the result.
   *
   * @param action - The Ledger action to perform.
   * @param params - Optional parameters for the action.
   * @returns The result of the action.
   */
  private async handleLedgerAction(
    action: LedgerAction,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    switch (action) {
      case LedgerAction.makeApp:
        return this.makeApp();

      case LedgerAction.updateTransport:
        // For direct WebHID, transport type is always webhid
        // This is a no-op but we return true for compatibility
        return true;

      case LedgerAction.getAppNameAndVersion: {
        if (!this.transport) {
          await this.makeApp();
        }
        if (!this.transport) {
          throw new Error('No transport available');
        }
        // Use raw transport command (0xb0, 0x01) to get app name and version
        const response = await this.transport.send(0xb0, 0x01, 0x00, 0x00);
        let offset = 1; // Skip format byte
        const nameLength = response[offset];
        offset += 1;
        const appName = response
          .subarray(offset, offset + nameLength)
          .toString('ascii');
        offset += nameLength;
        const versionLength = response[offset];
        offset += 1;
        const version = response
          .subarray(offset, offset + versionLength)
          .toString('ascii');
        return { appName, version };
      }

      case LedgerAction.getAppConfiguration:
        if (!this.transport) {
          await this.makeApp();
        }
        if (!this.transport) {
          throw new Error('No transport available');
        }
        return this.ethApp?.getAppConfiguration();

      case LedgerAction.getPublicKey:
        if (!params?.hdPath || typeof params.hdPath !== 'string') {
          throw new Error('Missing hdPath parameter');
        }
        return this.getPublicKey(params.hdPath);

      case LedgerAction.signTransaction:
        if (
          !params?.hdPath ||
          typeof params.hdPath !== 'string' ||
          !params?.tx ||
          typeof params.tx !== 'string'
        ) {
          throw new Error('Missing hdPath or tx parameter');
        }
        return this.signTransaction(params.hdPath, params.tx);

      case LedgerAction.signPersonalMessage:
        if (
          !params?.hdPath ||
          typeof params.hdPath !== 'string' ||
          !params?.message ||
          typeof params.message !== 'string'
        ) {
          throw new Error('Missing hdPath or message parameter');
        }
        return this.signPersonalMessage(params.hdPath, params.message);

      case LedgerAction.signTypedData:
        if (
          !params?.hdPath ||
          typeof params.hdPath !== 'string' ||
          !params?.message ||
          typeof params.message !== 'object'
        ) {
          throw new Error('Missing hdPath or message parameter');
        }
        return this.signTypedData({
          hdPath: params.hdPath,
          message: params.message as {
            domain: Record<string, unknown>;
            types: Record<string, unknown>;
            primaryType: string;
            message: Record<string, unknown>;
          },
        });

      default:
        throw new Error(`Unknown Ledger action: ${action as string}`);
    }
  }

  /**
   * Initializes the Ledger offscreen handler.
   * Sets up device event listeners and message handlers.
   */
  async init(): Promise<void> {
    this.setupDeviceEventListeners();
    this.setupMessageListener();

    // Check if there's already a permitted device connected
    if (!isWebHIDSupported()) {
      console.warn(
        'WebHID not supported, Ledger functionality will be limited',
      );
      return;
    }

    try {
      const devices = await navigator.hid.getDevices();
      const hasLedger = devices.some(
        (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
      );

      if (hasLedger) {
        // Notify extension that a Ledger device is available
        chrome.runtime.sendMessage({
          target: OffscreenCommunicationTarget.extension,
          event: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: true,
        });
      }
    } catch (error) {
      console.error('Error checking for permitted Ledger devices:', error);
    }
  }
}

/**
 * Initializes the Ledger offscreen handler.
 * Sets up device event listeners and message handlers.
 */
export default async function init(): Promise<void> {
  const handler = new LedgerOffscreenHandler();
  await handler.init();
}
