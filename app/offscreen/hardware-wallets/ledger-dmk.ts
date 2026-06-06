import { LedgerDMKBridge } from '@metamask/eth-ledger-bridge-keyring';

import { DeviceManagementKit } from '@ledgerhq/device-management-kit';
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
 * Ledger handler backed by `LedgerDMKBridge` from `@metamask/eth-ledger-bridge-keyring`.
 *
 * Caches a single bridge instance for the lifetime of the offscreen document.
 * If the device disconnects, the bridge is destroyed and the next action
 * triggers a fresh connection.
 *
 * Selection between this handler and the legacy `LedgerLegacyHandler` is
 * driven by the `ledgerDmkBridge` remote feature flag. See `initLedger(mode)`.
 */
export class LedgerDMKBridgeHandler {
  private bridge: LedgerDMKBridge | null = null;

  private bridgePromise: Promise<LedgerDMKBridge> | null = null;

  private sessionId: string | null = null;

  private sessionStateSubscription: Subscription | null = null;

  /**
   * Lazily creates and caches the `LedgerDMKBridge` instance.
   * Deduplicates concurrent calls via `bridgePromise`.
   *
   * @returns A connected `LedgerDMKBridge`.
   */
  private async ensureBridge(): Promise<LedgerDMKBridge> {
    if (this.bridge) {
      return this.bridge;
    }
    if (this.bridgePromise) {
      return this.bridgePromise;
    }

    this.bridgePromise = this.constructBridge();
    try {
      const b = await this.bridgePromise;
      this.bridge = b;
      return b;
    } catch (error) {
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
    const bridge = new LedgerDMKBridge({
      transportFactory: webHidTransportFactory,
    });

    const device = await this.findPermittedDevice(bridge.dmk);
    console.debug(
      '[LedgerDMK] Device discovered, connecting...',
      JSON.stringify({ device: device.name }),
    );

    this.sessionId = await bridge.connect({ device });
    console.debug(
      '[LedgerDMK] Session established',
      JSON.stringify({ sessionId: this.sessionId }),
    );

    // Wait for the session to reach a ready state (current app reported)
    // before handing the session off to callers. Without this, connect()
    // resolves before the device has completed app discovery and subsequent
    // bridge commands can race against session initialization.
    const state$ = bridge.dmk.getDeviceSessionState({
      sessionId: this.sessionId,
    });
    await firstValueFrom(
      state$.pipe(
        filter(
          (s: any) =>
            (s.sessionStateType === 1 || s.sessionStateType === 2) &&
            s.currentApp,
        ),
      ),
    );
    console.debug(
      '[LedgerDMK] Session ready',
      JSON.stringify({ sessionId: this.sessionId }),
    );

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
          console.debug('[LedgerDMK] Device disconnected, destroying bridge');
          this.destroy().catch((e) => {
            console.warn('[LedgerDMK] Error destroying bridge:', e);
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
      console.warn(
        '[LedgerDMK] WebHID not supported, skipping device event listeners',
      );
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
    console.debug('[LedgerDMK] Setting up message listener');
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

        console.debug(
          '[LedgerDMK] Received message',
          JSON.stringify({
            action: msg.action,
            hasParams: Boolean(msg.params),
          }),
        );

        this.handleAction(msg.action, msg.params)
          .then((result) => {
            console.debug(
              '[LedgerDMK] Action succeeded',
              JSON.stringify({ action: msg.action }),
            );
            sendResponse({
              success: true,
              payload: result,
            });
          })
          .catch((error) => {
            console.error('[LedgerDMK] Action failed:', error);
            sendResponse({
              success: false,
              payload: {
                error: serializeError(error),
              },
            });
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
  async handleAction(
    action: LedgerAction,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
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
        return bridge.deviceSignTransaction({
          tx: params.tx,
          hdPath: params.hdPath,
        });
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
        return bridge.deviceSignMessage({
          hdPath: params.hdPath,
          message: params.message,
        });
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
        return bridge.deviceSignTypedData({
          hdPath: params.hdPath,
          message: params.message,
        });
      }

      case LedgerAction.signEip7702Authorization: {
        if (
          !params?.hdPath ||
          typeof params.chainId !== 'number' ||
          !params.contractAddress ||
          typeof params.nonce !== 'number'
        ) {
          throw new Error(
            'Missing required parameters: hdPath, chainId, contractAddress, nonce',
          );
        }
        const bridge = await this.ensureBridge();
        return bridge.deviceSignDelegationAuthorization({
          hdPath: params.hdPath,
          chainId: params.chainId,
          contractAddress: params.contractAddress,
          nonce: params.nonce,
        });
      }

      default:
        throw new Error(`Unknown Ledger action: ${action as string}`);
    }
  }

  /**
   * Initializes the handler.
   * Sets up device event listeners and message handlers.
   */
  async init(): Promise<void> {
    console.debug('[LedgerDMK] init() — starting');
    this.setupDeviceEventListeners();
    this.setupMessageListener();
    console.debug('[LedgerDMK] init() — listeners registered');

    // Notify extension if a Ledger is already permitted
    if (!isWebHIDSupported()) {
      console.warn(
        '[LedgerDMK] WebHID not supported, Ledger functionality will be limited',
      );
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
    console.debug('[LedgerDMK] init() — complete');
  }

  /**
   * Destroys the cached bridge and cleans up subscriptions.
   * Safe to call multiple times.
   */
  async destroy(): Promise<void> {
    if (this.sessionStateSubscription) {
      this.sessionStateSubscription.unsubscribe();
      this.sessionStateSubscription = null;
    }
    if (this.bridge) {
      try {
        await this.bridge.destroy();
      } catch (error) {
        console.warn('[LedgerDMK] Error destroying bridge:', error);
      }
      this.bridge = null;
    }
    this.bridgePromise = null;
    this.sessionId = null;
  }
}
