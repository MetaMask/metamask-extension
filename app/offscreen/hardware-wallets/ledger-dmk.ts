import {
  createLedgerError,
  isKnownLedgerError,
  LedgerDMKBridge,
  LedgerSignDelegationAuthorizationParams,
  LedgerSignTypedDataParams,
} from '@metamask/eth-ledger-bridge-keyring';

import {
  DeviceManagementKit,
  DeviceSessionStateType,
} from '@ledgerhq/device-management-kit';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';

import {
  catchError,
  filter,
  firstValueFrom,
  map,
  Subscription,
  throwError,
  TimeoutError,
  timeout as timeoutOperator,
} from 'rxjs';

import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import { LEDGER_USB_VENDOR_ID } from '../../../shared/constants/hardware-wallets';

const DEVICE_DISCOVERY_TIMEOUT_MS = 15_000;
const SESSION_READY_TIMEOUT_MS = 15_000;

function isWebHIDSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.hid !== 'undefined'
  );
}

function replaceErrors(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    const result: Record<string, unknown> = {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
    // Include all own properties (e.g. statusCode, code, innerError)
    for (const key of Object.getOwnPropertyNames(value)) {
      if (!(key in result)) {
        result[key] = (value as Record<string, unknown>)[key];
      }
    }
    return result;
  }
  return value;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, replaceErrors);
  } catch {
    return String(value);
  }
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
  extra?: unknown;
} {
  if (error instanceof Error) {
    const serialized: {
      message: string;
      statusCode?: number;
      name?: string;
      extra?: unknown;
    } = {
      message:
        typeof error.message === 'string'
          ? error.message
          : safeStringify(error.message),
      name: error.name,
    };

    // Preserve statusCode for TransportStatusError
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      serialized.statusCode = error.statusCode;
    }

    // Capture any other interesting own properties
    const extras: Record<string, unknown> = {};
    for (const key of Object.getOwnPropertyNames(error)) {
      if (
        key !== 'message' &&
        key !== 'name' &&
        key !== 'stack' &&
        key !== 'statusCode'
      ) {
        extras[key] = (error as Record<string, unknown>)[key];
      }
    }
    if (Object.keys(extras).length > 0) {
      serialized.extra = extras;
    }

    return serialized;
  }
  return { message: safeStringify(error) };
}

/**
 * Serializes a Ledger device error, converting known APDU status codes
 * (e.g. 0x6985 user rejection) into a HardwareWalletError shape so that
 * downstream consumers (offscreen bridge, keyring, UI) receive a
 * structured error rather than a raw transport error.
 *
 * @param error - The error to serialize.
 * @returns Serialized error object.
 */
export function serializeLedgerError(error: unknown): {
  message: string;
  statusCode?: number;
  name?: string;
  code?: number;
  severity?: string;
  category?: string;
  userMessage?: string;
  extra?: unknown;
} {
  if (
    error instanceof Error &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    const statusCodeHex = `0x${error.statusCode.toString(16)}`;

    if (isKnownLedgerError(statusCodeHex)) {
      const hwError = createLedgerError(statusCodeHex);
      return {
        message: hwError.message,
        name: hwError.name,
        code: hwError.code,
        severity: hwError.severity,
        category: hwError.category,
        userMessage: hwError.userMessage,
        statusCode: error.statusCode,
      };
    }
  }

  return serializeError(error);
}

type LedgerDevice = Parameters<DeviceManagementKit['connect']>[0]['device'];

/**
 * Normalizes an error thrown during device discovery into a single `Error`.
 *
 * RxJS `TimeoutError` becomes a clearer "No permitted Ledger device found"
 * message; other `Error` instances pass through unchanged; anything else is
 * stringified.
 *
 * @param reason - The value thrown by `listenToAvailableDevices` or its
 * `timeout` operator.
 */
function normalizeDiscoveryError(reason: unknown): Error {
  if (reason instanceof TimeoutError) {
    return new Error('No permitted Ledger device found');
  }
  if (reason instanceof Error) {
    return reason;
  }
  return new Error(JSON.stringify(reason));
}

/**
 * Normalizes an error thrown while waiting for the DMK session to become
 * ready. Timeouts become an explicit session-ready error so callers are not
 * left hanging indefinitely.
 *
 * @param reason - The value thrown by the session-state observable pipeline.
 */
function normalizeSessionReadyError(reason: unknown): Error {
  if (reason instanceof TimeoutError) {
    return new Error('Ledger device session timed out waiting for ready state');
  }
  if (reason instanceof Error) {
    return reason;
  }
  return new Error(JSON.stringify(reason));
}

/**
 * Ledger handler backed by `LedgerDMKBridge` from `@metamask/eth-ledger-bridge-keyring`.
 *
 * Caches a single bridge instance for the lifetime of the offscreen document.
 * If the device disconnects, the bridge is destroyed and the next action
 * triggers a fresh connection.
 *
 * Selection between this handler and the legacy `LedgerLegacyHandler` is
 * driven by the `ledgerDmkBridge` remote feature flag. See `initLedger(mode)`.
 */
export class LedgerDmkBridgeHandler {
  private bridge: LedgerDMKBridge | null = null;

  private bridgePromise: Promise<LedgerDMKBridge> | null = null;

  private sessionId: string | null = null;

  private sessionStateSubscription: Subscription | null = null;

  private messageListenerFn:
    | ((
        msg: Record<string, unknown>,
        sender: unknown,
        sendResponse: (response: unknown) => void,
      ) => boolean)
    | null = null;

  /**
   * Lazily creates and caches the `LedgerDMKBridge` instance.
   * Deduplicates concurrent calls via `bridgePromise`.
   *
   * @returns A connected `LedgerDMKBridge`.
   */
  private async ensureBridge(): Promise<LedgerDMKBridge> {
    if (this.bridge) {
      console.log('[LedgerDMK] ensureBridge: reusing cached bridge');
      return this.bridge;
    }
    if (this.bridgePromise) {
      console.log('[LedgerDMK] ensureBridge: awaiting in-flight bridge connect');
      return this.bridgePromise;
    }

    console.log('[LedgerDMK] ensureBridge: constructing new bridge');
    this.bridgePromise = this.constructBridge();
    try {
      const b = await this.bridgePromise;
      this.bridge = b;
      console.log('[LedgerDMK] ensureBridge: bridge ready', {
        sessionId: this.sessionId,
      });
      return b;
    } catch (error) {
      console.error('[LedgerDMK] ensureBridge: connect failed', error);
      this.bridgePromise = null;
      this.sessionId = null;
      throw error;
    }
  }

  /**
   * Constructs a fresh `LedgerDMKBridge`, discovers a permitted device,
   * connects, and waits for session readiness.
   *
   * @returns A connected `LedgerDMKBridge`.
   */
  private async constructBridge(): Promise<LedgerDMKBridge> {
    console.log('[LedgerDMK] constructBridge: creating LedgerDMKBridge');
    const bridge = new LedgerDMKBridge({
      // The transport package resolves DMK 1.7.1 while the bridge resolves its
      // nested DMK 1.5.1. Their runtime contract is compatible, but protected
      // members make the duplicate declaration types nominally incompatible.
      transportFactory:
        webHidTransportFactory as unknown as NonNullable<
          ConstructorParameters<typeof LedgerDMKBridge>[0]['transportFactory']
        >,
    });

    console.log('[LedgerDMK] constructBridge: finding permitted device');
    const device = await this.findPermittedDevice(bridge.dmk);
    console.log('[LedgerDMK] constructBridge: connecting to device');
    this.sessionId = await bridge.connect({ device });

    // Wait for the session to reach a ready state (current app reported)
    // before handing the session off to callers. Without this, connect()
    // resolves before the device has completed app discovery and subsequent
    // bridge commands can race against session initialization.
    console.log('[LedgerDMK] constructBridge: waiting for session ready', {
      sessionId: this.sessionId,
    });
    const state$ = bridge.dmk.getDeviceSessionState({
      sessionId: this.sessionId,
    });
    await firstValueFrom(
      state$.pipe(
        filter(
          (s) =>
            (s.sessionStateType ===
              DeviceSessionStateType.ReadyWithoutSecureChannel ||
              s.sessionStateType ===
                DeviceSessionStateType.ReadyWithSecureChannel) &&
            Boolean(s.currentApp),
        ),
        timeoutOperator(SESSION_READY_TIMEOUT_MS),
        catchError((reason: unknown) =>
          throwError(() => normalizeSessionReadyError(reason)),
        ),
      ),
    );

    console.log('[LedgerDMK] constructBridge: session ready');

    // Subscribe to disconnect events so we tear down the bridge when the
    // device is unplugged.
    this.setupDisconnectMonitoring(bridge);

    return bridge;
  }

  /**
   * Subscribes to `onSessionStateChange` to detect device disconnects.
   * On disconnect, destroys the cached bridge so the next action triggers
   * a fresh connection.
   * @param bridge
   */
  private setupDisconnectMonitoring(bridge: LedgerDMKBridge): void {
    if (this.sessionStateSubscription) {
      this.sessionStateSubscription.unsubscribe();
    }
    this.sessionStateSubscription = bridge.onSessionStateChange.subscribe({
      next: ({ connected }) => {
        if (!connected) {
          this.destroy().catch(() => {
            // Best-effort cleanup after disconnect
          });
        }
      },
    });
  }

  /**
   * Waits for an already-permitted Ledger device to appear via WebHID.
   *
   * In the offscreen document `requestDevice()` fails without a user gesture,
   * so we use `listenToAvailableDevices()` which calls `getDevices()` internally.
   *
   * @param dmk - The Device Management Kit instance from the bridge.
   * @returns The first available device.
   */
  private async findPermittedDevice(
    dmk: DeviceManagementKit,
  ): Promise<LedgerDevice> {
    return firstValueFrom(
      dmk.listenToAvailableDevices({}).pipe(
        filter((devices) => devices.length > 0),
        map((devices) => devices[0]),
        timeoutOperator(DEVICE_DISCOVERY_TIMEOUT_MS),
        catchError((reason: unknown) =>
          throwError(() => normalizeDiscoveryError(reason)),
        ),
      ),
    );
  }

  /**
   * Sets up HID device event listeners for connect/disconnect events.
   */
  private setupDeviceEventListeners(): void {
    if (!isWebHIDSupported()) {
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
    this.messageListenerFn = (
      msg: Record<string, unknown>,
      _sender: unknown,
      sendResponse: (response: unknown) => void,
    ): boolean => {
      if (
        msg.target !== OffscreenCommunicationTarget.ledgerOffscreen ||
        typeof msg.action !== 'string'
      ) {
        return false;
      }

      const action = msg.action as LedgerAction;
      const params =
        msg.params && typeof msg.params === 'object'
          ? (msg.params as Record<string, unknown>)
          : undefined;

      this.handleAction(action, params)
        .then((result) => {
          sendResponse({
            success: true,
            payload: result,
          });
        })
        .catch((error: unknown) => {
          console.error('[LedgerDMK] Action failed:', error);
          const serialized = serializeLedgerError(error);
          sendResponse({
            success: false,
            payload: {
              error: serialized,
            },
          });
        });

      // Return true to indicate we will send response asynchronously
      return true;
    };

    chrome.runtime.onMessage.addListener(this.messageListenerFn);
  }

  /**
   * Handles a Ledger action and returns the result.
   *
   * @param action - The Ledger action to perform.
   * @param params - Optional parameters for the action.
   * @returns The result of the action.
   */
  async handleAction(
    action: LedgerAction,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    console.log('[LedgerDMK] handleAction', action);
    const bridge = await this.ensureBridge();

    switch (action) {
      case LedgerAction.makeApp:
        // DMK bridge auto-opens the ETH app on each signing operation, so
        // makeApp is effectively a no-op. We route it to getAppNameAndVersion
        // to preserve the semantic that makeApp verifies the device is
        // reachable and the ETH app is open.
        return bridge.getAppNameAndVersion();

      case LedgerAction.updateTransport:
        // DMK uses WebHID exclusively; no transport switching.
        return true;

      case LedgerAction.getAppNameAndVersion:
        return bridge.getAppNameAndVersion();

      case LedgerAction.getAppConfiguration:
        return bridge.getAppConfiguration();

      case LedgerAction.getPublicKey: {
        if (!params?.hdPath || typeof params.hdPath !== 'string') {
          throw new Error('Missing hdPath parameter');
        }
        return bridge.getPublicKey({ hdPath: params.hdPath });
      }

      case LedgerAction.signTransaction: {
        if (
          !params?.hdPath ||
          typeof params.hdPath !== 'string' ||
          !params?.tx ||
          typeof params.tx !== 'string'
        ) {
          throw new Error('Missing hdPath or tx parameter');
        }
        console.log('[LedgerDMK] signTransaction start', {
          hdPath: params.hdPath,
          txLength: params.tx.length,
        });
        try {
          const result = await bridge.deviceSignTransaction({
            tx: params.tx,
            hdPath: params.hdPath,
          });
          console.log('[LedgerDMK] signTransaction success', {
            hdPath: params.hdPath,
          });
          return result;
        } catch (error) {
          console.error('[LedgerDMK] signTransaction failed', {
            hdPath: params.hdPath,
            error,
          });
          throw error;
        }
      }

      case LedgerAction.signPersonalMessage: {
        if (
          !params?.hdPath ||
          typeof params.hdPath !== 'string' ||
          !params?.message ||
          typeof params.message !== 'string'
        ) {
          throw new Error('Missing hdPath or message parameter');
        }
        console.log('[LedgerDMK] signPersonalMessage start', {
          hdPath: params.hdPath,
          messageLength: params.message.length,
        });
        try {
          const result = await bridge.deviceSignMessage({
            hdPath: params.hdPath,
            message: params.message,
          });
          console.log('[LedgerDMK] signPersonalMessage success', {
            hdPath: params.hdPath,
          });
          return result;
        } catch (error) {
          console.error('[LedgerDMK] signPersonalMessage failed', {
            hdPath: params.hdPath,
            error,
          });
          throw error;
        }
      }

      case LedgerAction.signTypedData: {
        if (
          !params?.hdPath ||
          typeof params.hdPath !== 'string' ||
          !params?.message ||
          typeof params.message !== 'object'
        ) {
          throw new Error('Missing hdPath or message parameter');
        }
        const typedMessage =
          params.message as LedgerSignTypedDataParams['message'];
        console.log('[LedgerDMK] signTypedData start', {
          hdPath: params.hdPath,
          primaryType: typedMessage.primaryType,
        });
        try {
          const result = await bridge.deviceSignTypedData({
            hdPath: params.hdPath,
            message: typedMessage,
          });
          console.log('[LedgerDMK] signTypedData success', {
            hdPath: params.hdPath,
            primaryType: typedMessage.primaryType,
          });
          return result;
        } catch (error) {
          console.error('[LedgerDMK] signTypedData failed', {
            hdPath: params.hdPath,
            primaryType: typedMessage.primaryType,
            error,
          });
          throw error;
        }
      }

      case LedgerAction.signDelegationAuthorization: {
        if (
          !params?.hdPath ||
          typeof params.hdPath !== 'string' ||
          typeof params.chainId !== 'number' ||
          typeof params.contractAddress !== 'string' ||
          typeof params.nonce !== 'number'
        ) {
          throw new Error('Missing delegation authorization parameter');
        }
        const delegationParams: LedgerSignDelegationAuthorizationParams = {
          hdPath: params.hdPath,
          chainId: params.chainId,
          contractAddress: params.contractAddress,
          nonce: params.nonce,
        };
        return bridge.deviceSignDelegationAuthorization(delegationParams);
      }

      default:
        throw new Error(`Unknown Ledger action: ${action as string}`);
    }
  }

  /**
   * Initializes the handler.
   * Sets up device event listeners and message handlers.
   *
   * @param skipMessageListener - When true, the handler does NOT register its
   * own chrome.runtime.onMessage listener.  This is used when a central
   * router (ledger-router.ts) manages the listener instead.
   */
  async init(skipMessageListener = false): Promise<void> {
    this.setupDeviceEventListeners();
    if (!skipMessageListener) {
      this.setupMessageListener();
    }

    // Notify extension if a Ledger is already permitted
    if (!isWebHIDSupported()) {
      return;
    }

    try {
      const devices = await navigator.hid.getDevices();
      const hasLedger = devices.some(
        (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
      );

      if (hasLedger) {
        chrome.runtime.sendMessage({
          target: OffscreenCommunicationTarget.extension,
          event: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: true,
        });
      }
    } catch (error) {
      console.error(
        '[LedgerDMK] Error checking for permitted Ledger devices:',
        error,
      );
    }
  }

  /**
   * Destroys the cached bridge and cleans up subscriptions.
   * Safe to call multiple times.
   */
  async destroy(): Promise<void> {
    if (this.messageListenerFn) {
      chrome.runtime.onMessage.removeListener(this.messageListenerFn);
      this.messageListenerFn = null;
    }
    if (this.sessionStateSubscription) {
      this.sessionStateSubscription.unsubscribe();
      this.sessionStateSubscription = null;
    }
    if (this.bridge) {
      try {
        await this.bridge.destroy();
      } catch {
        // Bridge cleanup failed; nothing to recover here.
      }
      this.bridge = null;
    }
    this.bridgePromise = null;
    this.sessionId = null;
  }
}
