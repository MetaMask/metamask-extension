import LedgerEth from '@ledgerhq/hw-app-eth';
import type Transport from '@ledgerhq/hw-transport';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { parse as parseTransaction } from '@ethersproject/transactions';
import {
  ERC20_WRITE_SELECTORS,
  getTransactionSelector,
  LedgerSignTypedDataParams,
  NFT_ONLY_SELECTORS,
} from '@metamask/eth-ledger-bridge-keyring';
import { TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util';
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import { add0x } from '@metamask/utils';

import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import { LEDGER_USB_VENDOR_ID } from '../../../shared/constants/hardware-wallets';

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
 * Returns the 4-byte selector for transactions that expose calldata in `data`.
 * Falls back to parsing the transaction directly for legacy unsigned payloads
 * that the shared Ledger selector helper does not currently recognize.
 *
 * @param tx - The raw serialized transaction hex string.
 * @returns The selector if calldata is present.
 */
function getSelectorWithLegacyFallback(tx: string): string | undefined {
  const selector = getTransactionSelector(tx);

  if (selector) {
    return selector;
  }

  try {
    const { data } = parseTransaction(add0x(tx));

    if (typeof data === 'string' && data.length >= 10) {
      return data.slice(0, 10).toLowerCase();
    }
  } catch {
    // Ignore parse failures and fall through to undefined.
  }

  return undefined;
}

/**
 * Legacy Ledger handler using `@ledgerhq/hw-app-eth` + `TransportWebHID`.
 *
 * This is the original Ledger implementation, kept as a fallback for the
 * newer `LedgerDmkBridgeHandler` (in `./ledger-dmk.ts`). Selection between
 * the two is driven by the `ledgerDmkBridge` remote feature flag.
 *
 * Handles Ledger communication in the offscreen document.
 * Manages transport and app state as instance variables.
 */
export class LedgerLegacyHandler {
  private transport: Transport | null = null;

  private ethApp: LedgerEth | null = null;

  // Prevents concurrent makeApp calls from creating multiple transports
  private pendingMakeApp: Promise<boolean> | null = null;

  // Stored references to `navigator.hid` listeners so `destroy()` can remove
  // them. Without these references the listeners leak for the lifetime of the
  // offscreen document, which becomes a problem now that handlers can be
  // swapped at runtime via `switchLedgerHandler`.
  private hidConnectListener: ((event: { device: HIDDevice }) => void) | null =
    null;

  private hidDisconnectListener:
    | ((event: { device: HIDDevice }) => void)
    | null = null;

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
    // The nft parameter resolution is selector-based only: approve() uses
    // the same selector (0x095ea7b3) for both ERC20 and ERC721
    // (see @ledgerhq/evm-tools selectors and hw-app-eth resolveTransaction).
    //
    // The nft parameter will be set to true only for the selectors defined in
    // NFT_ONLY_SELECTORS, that way we can tell "token allowance" from "NFT allowance"
    // for every operation except approve().
    const selector = getSelectorWithLegacyFallback(tx);
    const isNftTx = Boolean(selector && NFT_ONLY_SELECTORS.has(selector));
    const isERC20Tx = Boolean(selector && ERC20_WRITE_SELECTORS.has(selector));

    try {
      const result = await app.clearSignTransaction(hdPath, tx, {
        externalPlugins: true,
        erc20: isERC20Tx,
        nft: isNftTx,
      });
      return {
        v: result.v,
        r: result.r,
        s: result.s,
      };
    } catch (error) {
      if (this.#isUserRejectedError(error)) {
        throw error;
      }

      // Clear-signing resolution failed (no Ledger plugin for this contract /
      // chain, external plugin lookup error, etc). Retry with resolution=null
      // so the device performs a raw "blind sign" — which works when the user
      // has blind signing enabled on device. See GH 41602.
      console.warn(
        'Ledger clearSignTransaction failed; falling back to blind signTransaction',
        error,
      );
      const result = await app.signTransaction(hdPath, tx, null);
      return {
        v: result.v,
        r: result.r,
        s: result.s,
      };
    }
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
   * Signs EIP-712 typed data. Tries clear signing first (signEIP712Message), which
   * shows human-readable data on the device. If that fails with INS_NOT_SUPPORTED (e.g.
   * Ledger Nano S), falls back to hashed signing (signEIP712HashedMessage) which shows
   * only the domain and message hashes.
   *
   * Matches Ledger Live's approach:
   * https://github.com/LedgerHQ/ledger-live/blob/c49f4d4d34f82ac74a4237cfe3b31ce3c0f73403/libs/coin-modules/coin-evm/src/hw-signMessage.ts#L80-L113
   *
   * @param params - The signing parameters.
   * @param params.hdPath - The HD derivation path.
   * @param params.message - The EIP-712 typed data message.
   * @returns Signature components v, r, s.
   */
  private async signTypedData(
    params: LedgerSignTypedDataParams,
  ): Promise<{ v: number; r: string; s: string }> {
    const app = await this.ensureApp();

    try {
      return await app.signEIP712Message(params.hdPath, params.message);
    } catch (error) {
      if (!this.#isInsNotSupported(error)) {
        throw error;
      }

      const { domainSeparatorHex, hashStructMessageHex } =
        this.#computeEIP712Hashes(params.message);

      return app.signEIP712HashedMessage(
        params.hdPath,
        domainSeparatorHex,
        hashStructMessageHex,
      );
    }
  }

  // Computes EIP-712 domain separator and message struct hashes.
  #computeEIP712Hashes(message: LedgerSignTypedDataParams['message']): {
    domainSeparatorHex: string;
    hashStructMessageHex: string;
  } {
    const sanitizedMessage = TypedDataUtils.sanitizeData(
      message as Parameters<typeof TypedDataUtils.sanitizeData>[0],
    );

    const domainSeparatorHex = TypedDataUtils.hashStruct(
      'EIP712Domain',
      sanitizedMessage.domain,
      sanitizedMessage.types,
      SignTypedDataVersion.V4,
    ).toString('hex');

    const hashStructMessageHex = TypedDataUtils.hashStruct(
      sanitizedMessage.primaryType as string,
      sanitizedMessage.message,
      sanitizedMessage.types,
      SignTypedDataVersion.V4,
    ).toString('hex');

    return { domainSeparatorHex, hashStructMessageHex };
  }

  // Checks if an error is a Ledger 'INS_NOT_SUPPORTED' error.
  #isInsNotSupported(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error as { statusText?: string }).statusText === 'INS_NOT_SUPPORTED'
    );
  }

  // Ledger status 0x6985 (CONDITIONS_OF_USE_NOT_SATISFIED) is the device
  // rejection path. Preserving this prevents clear-sign failures from
  // silently re-prompting the user with a blind-sign retry.
  #isUserRejectedError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const { statusCode, statusText } = error as {
      statusCode?: unknown;
      statusText?: unknown;
    };
    return (
      statusCode === 0x6985 || statusText === 'CONDITIONS_OF_USE_NOT_SATISFIED'
    );
  }

  /**
   * Sets up HID device event listeners for connect/disconnect events.
   *
   * The listener references are stored on the instance so `destroy()` can
   * remove them when the handler is torn down (e.g., during
   * `switchLedgerHandler`).
   */
  private setupDeviceEventListeners(): void {
    if (!isWebHIDSupported()) {
      console.warn('WebHID not supported, skipping device event listeners');
      return;
    }

    this.hidConnectListener = ({ device }: { device: HIDDevice }) => {
      if (device.vendorId === Number(LEDGER_USB_VENDOR_ID)) {
        chrome.runtime.sendMessage({
          target: OffscreenCommunicationTarget.extension,
          event: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: true,
        });
      }
    };

    this.hidDisconnectListener = ({ device }: { device: HIDDevice }) => {
      if (device.vendorId === Number(LEDGER_USB_VENDOR_ID)) {
        // Clean up transport state on disconnect
        this.closeTransport();

        chrome.runtime.sendMessage({
          target: OffscreenCommunicationTarget.extension,
          event: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: false,
        });
      }
    };

    navigator.hid.addEventListener('connect', this.hidConnectListener);
    navigator.hid.addEventListener('disconnect', this.hidDisconnectListener);
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
          message: params.message,
        } as LedgerSignTypedDataParams);

      case LedgerAction.signDelegationAuthorization:
        throw new Error(
          'Ledger delegation authorization signing requires DMK mode',
        );

      default:
        throw new Error(`Unknown Ledger action: ${action as string}`);
    }
  }

  /**
   * Public entry point for processing Ledger actions.
   *
   * Used by the centralized ledger-router so both DMK and Legacy handlers
   * expose the same `handleAction` surface for the message listener.
   * Closes the underlying WebHID transport after every action so the device
   * is released back to the OS even when the action fails.
   *
   * @param action - The Ledger action to perform (e.g. `getPublicKey`,
   * `signTransaction`). Must be a member of `LedgerAction`.
   * @param params - Optional action payload. Shape depends on `action`; for
   * example, `getPublicKey` expects `{ hdPath: string }` while
   * `signTransaction` expects `{ hdPath: string; tx: string }`. Unrecognised
   * fields are ignored.
   * @returns Resolves with the action-specific result (e.g. an address object
   * for `getPublicKey`), or rejects with the underlying Ledger error.
   */
  async handleAction(
    action: LedgerAction,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      return await this.handleLedgerAction(action, params);
    } finally {
      await this.closeTransport();
    }
  }

  /**
   * Cleans up the handler: removes the chrome message listener and any
   * `navigator.hid` connect/disconnect listeners, then closes any open
   * transport.
   *
   * Safe to call multiple times.
   */
  async destroy(): Promise<void> {
    if (this.hidConnectListener && typeof navigator !== 'undefined') {
      navigator.hid.removeEventListener('connect', this.hidConnectListener);
      this.hidConnectListener = null;
    }

    if (this.hidDisconnectListener && typeof navigator !== 'undefined') {
      navigator.hid.removeEventListener(
        'disconnect',
        this.hidDisconnectListener,
      );
      this.hidDisconnectListener = null;
    }

    await this.closeTransport();
  }

  /**
   * Initializes the Ledger offscreen handler.
   *
   * Wires up `navigator.hid` device event listeners and notifies the
   * extension if a Ledger device is already permitted. The central router
   * (ledger-router.ts) owns the `chrome.runtime.onMessage` listener and
   * dispatches actions to `handleAction`, so this method does not register
   * any message listener itself.
   */
  async init(): Promise<void> {
    this.setupDeviceEventListeners();

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
 * Creates a new legacy Ledger handler instance.
 *
 * The handler is returned WITHOUT calling init() — the central router
 * (ledger-router.ts) calls `handler.init()` and owns the single
 * `chrome.runtime.onMessage` listener that dispatches to `handleAction`.
 *
 * @returns A raw LedgerLegacyHandler instance (uninitialised).
 */
export default function initLegacy(): LedgerLegacyHandler {
  return new LedgerLegacyHandler();
}
