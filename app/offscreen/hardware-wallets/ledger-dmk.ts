import {
  LedgerDmkBridge,
  LedgerSignDelegationAuthorizationParams,
  LedgerSignTypedDataParams,
} from '@metamask/eth-ledger-bridge-keyring';

import {
  DeviceManagementKit,
} from '@ledgerhq/device-management-kit';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';

import {
  catchError,
  firstValueFrom,
  from,
  mergeMap,
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
import { serializeLedgerError } from './ledger-utils';

const DEVICE_DISCOVERY_TIMEOUT_MS = 15_000;

function isWebHIDSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.hid !== 'undefined'
  );
}

/**
 * Wraps the WebHID transport factory so `startDiscovering()` delegates to
 * `listenToAvailableDevices()` instead of `navigator.hid.requestDevice()`.
 *
 * In the offscreen document there is no user gesture, so `requestDevice()`
 * (which shows a native picker) always fails. `listenToAvailableDevices()`
 * wraps `navigator.hid.getDevices()` and returns already-permitted devices
 * without a gesture. By redirecting at the transport level, the bridge's
 * own DMK discovers and connects to devices using a single DMK instance —
 * no separate DMK, no monkey-patching of `navigator.hid`.
 *
 * `listenToAvailableDevices` emits `DiscoveredDevice[]` (array), while
 * `startDiscovering` emits `DiscoveredDevice` (individual). We flatten the
 * array with `mergeMap` + `from` so the observable contract matches what
 * the DMK's `startDiscovering` use-case expects.
 * @param originalFactory
 */
function createOffscreenTransportFactory(
  originalFactory: typeof webHidTransportFactory,
): typeof webHidTransportFactory {
  return ((deps: Parameters<typeof originalFactory>[0]) => {
    const transport = originalFactory(deps);
    transport.startDiscovering = () =>
      transport.listenToAvailableDevices().pipe(mergeMap((devices) => from(devices)));
    return transport;
  }) as typeof webHidTransportFactory;
}

type LedgerDevice = Parameters<DeviceManagementKit['connect']>[0]['device'];

/**
 * Converts an unknown thrown value into a message string without
 * `JSON.stringify`, which can throw on circular structures.
 *
 * @param reason - The value thrown by an observable pipeline.
 */
function toErrorMessage(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.message;
  }
  if (typeof reason === 'string') {
    return reason;
  }
  return String(reason);
}

/**
 * Creates a structured `HardwareWalletError` for handler-owned failure paths
 * (validation, teardown races, unknown actions).
 *
 * @param message - Error message and user-facing copy.
 * @param code - The hardware-wallet error code to assign.
 * @param category - Error category for downstream UI mapping.
 */
function createLedgerError(
  message: string,
  code: ErrorCode = ErrorCode.Unknown,
  category: Category = Category.Unknown,
): HardwareWalletError {
  return new HardwareWalletError(message, {
    code,
    severity: Severity.Err,
    category,
    userMessage: message,
  });
}

/**
 * Wraps an unknown thrown value as a structured `HardwareWalletError` so
 * downstream consumers can reconstruct it across the offscreen message
 * boundary. Existing `HardwareWalletError` instances are returned as-is.
 *
 * @param reason - The value thrown by an observable pipeline or bridge call.
 * @param code - The hardware-wallet error code to assign.
 * @param fallbackMessage - Message used when `reason` has no useful text.
 * @param category - Error category for downstream UI mapping.
 */
function toHardwareWalletError(
  reason: unknown,
  code: ErrorCode,
  fallbackMessage: string,
  category: Category = Category.Connection,
): HardwareWalletError {
  if (reason instanceof HardwareWalletError) {
    return reason;
  }

  const message = toErrorMessage(reason) || fallbackMessage;
  return new HardwareWalletError(message, {
    code,
    severity: Severity.Err,
    category,
    userMessage: message,
    cause: reason instanceof Error ? reason : undefined,
  });
}

/**
 * Normalizes an error thrown during device discovery into a structured
 * `HardwareWalletError` so downstream consumers can reconstruct it across
 * the offscreen message boundary.
 *
 * RxJS `TimeoutError` maps to `ErrorCode.DeviceDisconnected` to match the
 * legacy Ledger handler's "no permitted device" path.
 *
 * @param reason - The value thrown by `listenToAvailableDevices` or its
 * `timeout` operator.
 */
function normalizeDiscoveryError(reason: unknown): HardwareWalletError {
  if (reason instanceof TimeoutError) {
    const errorMessage = 'No permitted Ledger device found';
    return new HardwareWalletError(errorMessage, {
      code: ErrorCode.DeviceDisconnected,
      severity: Severity.Err,
      category: Category.Connection,
      userMessage: errorMessage,
      cause: reason,
    });
  }
  return toHardwareWalletError(
    reason,
    ErrorCode.Unknown,
    'Ledger device discovery failed',
  );
}

/**
 * Ledger handler backed by `LedgerDmkBridge` from `@metamask/eth-ledger-bridge-keyring`.
 *
 * Caches a single bridge instance for the lifetime of the offscreen document.
 * If the device disconnects, the bridge is destroyed and the next action
 * triggers a fresh connection.
 *
 * Selection between this handler and the legacy `LedgerLegacyHandler` is
 * driven by the `LedgerDmkBridge` remote feature flag. See `initLedger(mode)`.
 */
export class LedgerDmkBridgeHandler {
  private bridge: LedgerDmkBridge | null = null;

  private bridgePromise: Promise<LedgerDmkBridge> | null = null;

  /**
   * Bumped in `destroy()` so in-flight `constructBridge()` results are discarded
   * instead of resurrecting a torn-down handler.
   */
  private bridgeGeneration = 0;

  private sessionId: string | null = null;

  private sessionStateSubscription: Subscription | null = null;

  private messageListenerFn:
    | Parameters<typeof chrome.runtime.onMessage.addListener>[0]
    | null = null;

  // Stored references to `navigator.hid` listeners so `destroy()` can remove
  // them. Without these references the listeners leak for the lifetime of the
  // offscreen document when handlers are hot-swapped via `switchLedgerHandler`.
  private hidConnectListener: ((event: { device: HIDDevice }) => void) | null =
    null;

  private hidDisconnectListener:
    | ((event: { device: HIDDevice }) => void)
    | null = null;

  /**
   * Lazily creates and caches the `LedgerDmkBridge` instance.
   * Deduplicates concurrent calls via `bridgePromise`.
   *
   * @returns A connected `LedgerDmkBridge`.
   */
  private async ensureBridge(): Promise<LedgerDmkBridge> {
    if (this.bridge) {
      return this.bridge;
    }
    if (this.bridgePromise) {
      return this.bridgePromise;
    }

    const generation = this.bridgeGeneration;
    const pending = this.constructBridge()
      .then(async (bridge) => {
        // `destroy()` may have cleared state while construction was in flight.
        // Discard the orphaned bridge instead of resurrecting a torn-down handler.
        if (generation !== this.bridgeGeneration) {
          try {
            await bridge.destroy();
          } catch {
            // Best-effort cleanup of the orphaned bridge.
          }
          throw createLedgerError(
            'Ledger bridge was destroyed during construction',
            ErrorCode.DeviceInvalidSession,
            Category.Connection,
          );
        }
        this.bridge = bridge;
        console.log('[LedgerDMK] ensureBridge: bridge ready', {
          sessionId: this.sessionId,
        });
        return bridge;
      })
      .catch((error: unknown) => {
        console.error('[LedgerDMK] ensureBridge: connect failed', error);
        if (generation === this.bridgeGeneration) {
          this.bridgePromise = null;
          this.sessionId = null;
        }
        throw toHardwareWalletError(
          error,
          ErrorCode.Unknown,
          'Ledger bridge connection failed',
        );
      });

    this.bridgePromise = pending;
    return pending;
  }

  /**
   * Constructs a fresh `LedgerDmkBridge`, discovers a permitted device,
   * connects, and waits for session readiness.
   *
   * @returns A connected `LedgerDmkBridge`.
   */
  private async constructBridge(): Promise<LedgerDmkBridge> {
    console.log('[LedgerDMK] constructBridge: creating LedgerDmkBridge');
    const offscreenTransportFactory = createOffscreenTransportFactory(
      webHidTransportFactory,
    );
    const bridge = new LedgerDmkBridge({
      // The transport package resolves DMK 1.7.1 while the bridge resolves its
      // nested DMK 1.5.1. Their runtime contract is compatible, but protected
      // members make the duplicate declaration types nominally incompatible.
      // The factory is wrapped so `startDiscovering` uses `getDevices()` (no
      // user gesture needed) instead of `requestDevice()` (fails offscreen).
      transportFactory:
        offscreenTransportFactory as unknown as NonNullable<
          ConstructorParameters<typeof LedgerDmkBridge>[0]['transportFactory']
        >,
    });

    console.log('[LedgerDMK] constructBridge: finding permitted device');
    const device = await this.findPermittedDevice(bridge);
    console.log('[LedgerDMK] constructBridge: connecting to device');
    this.sessionId = await bridge.connect({ device });

    // `connect()` sets isConnected synchronously and starts session monitoring.
    // The bridge's signing methods handle device-action completion internally
    // via waitForDeviceAction, so no explicit readiness wait is needed here.
    // (onSessionStateChange is a Subject, not BehaviorSubject — subscribing
    // after connect() would miss the initial emission.)
    console.log('[LedgerDMK] constructBridge: session ready', {
      sessionId: this.sessionId,
    });

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
  private setupDisconnectMonitoring(bridge: LedgerDmkBridge): void {
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
   * Discovers a Ledger device via the bridge's own DMK.
   *
   * Uses `bridge.startDiscovering()` which delegates to the bridge's internal
   * `DeviceManagementKit`. The transport factory is wrapped so
   * `startDiscovering` uses `navigator.hid.getDevices()` (already-permitted
   * devices, no user gesture) instead of `requestDevice()` (picker dialog).
   *
   * @param bridge - The `LedgerDmkBridge` instance to discover through.
   * @returns The first discovered device.
   */
  private async findPermittedDevice(
    bridge: LedgerDmkBridge,
  ): Promise<LedgerDevice> {
    return firstValueFrom(
      bridge.startDiscovering({}).pipe(
        timeoutOperator(DEVICE_DISCOVERY_TIMEOUT_MS),
        catchError((reason: unknown) =>
          throwError(() => normalizeDiscoveryError(reason)),
        ),
      ),
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
      return;
    }

    // Avoid stacking duplicate listeners if init() is called more than once.
    this.removeDeviceEventListeners();

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
   * Removes HID connect/disconnect listeners registered by this handler.
   */
  private removeDeviceEventListeners(): void {
    if (!isWebHIDSupported()) {
      return;
    }

    if (this.hidConnectListener) {
      navigator.hid.removeEventListener('connect', this.hidConnectListener);
      this.hidConnectListener = null;
    }

    if (this.hidDisconnectListener) {
      navigator.hid.removeEventListener(
        'disconnect',
        this.hidDisconnectListener,
      );
      this.hidDisconnectListener = null;
    }
  }

  /**
   * Sets up the message listener for handling Ledger actions from the offscreen bridge.
   */
  private setupMessageListener(): void {
    const listener: Parameters<
      typeof chrome.runtime.onMessage.addListener
    >[0] = (msg, _sender, sendResponse) => {
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
            // `result` is handler-specific; ResponseType includes Record<string, unknown>.
            payload: result as Record<string, unknown>,
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

    this.messageListenerFn = listener;
    chrome.runtime.onMessage.addListener(listener);
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
    try {
      const bridge = await this.ensureBridge();

      switch (action) {
        case LedgerAction.makeApp:
          // DMK bridge auto-opens the ETH app on each signing operation, so
          // makeApp is effectively a no-op. We route it to getAppNameAndVersion
          // to preserve the semantic that makeApp verifies the device is
          // reachable and the ETH app is open.
          return await bridge.getAppNameAndVersion();

        case LedgerAction.updateTransport:
          // DMK uses WebHID exclusively; no transport switching.
          return true;

        case LedgerAction.getAppNameAndVersion:
          return await bridge.getAppNameAndVersion();

        case LedgerAction.getAppConfiguration:
          return await bridge.getAppConfiguration();

        case LedgerAction.getPublicKey: {
          if (!params?.hdPath || typeof params.hdPath !== 'string') {
            throw createLedgerError('Missing hdPath parameter');
          }
          return await bridge.getPublicKey({ hdPath: params.hdPath });
        }

        case LedgerAction.signTransaction: {
          if (
            !params?.hdPath ||
            typeof params.hdPath !== 'string' ||
            !params?.tx ||
            typeof params.tx !== 'string'
          ) {
            throw createLedgerError('Missing hdPath or tx parameter');
          }
          const result = await bridge.deviceSignTransaction({
            tx: params.tx,
            hdPath: params.hdPath,
          });
          return result;
        }

        case LedgerAction.signPersonalMessage: {
          if (
            !params?.hdPath ||
            typeof params.hdPath !== 'string' ||
            !params?.message ||
            typeof params.message !== 'string'
          ) {
            throw createLedgerError('Missing hdPath or message parameter');
          }
          const result = await bridge.deviceSignMessage({
            hdPath: params.hdPath,
            message: params.message,
          });
          return result;
        }

        case LedgerAction.signTypedData: {
          if (
            !params?.hdPath ||
            typeof params.hdPath !== 'string' ||
            !params?.message ||
            typeof params.message !== 'object'
          ) {
            throw createLedgerError('Missing hdPath or message parameter');
          }
          const typedMessage =
            params.message as LedgerSignTypedDataParams['message'];
          console.log('[LedgerDMK] signTypedData start', {
            hdPath: params.hdPath,
            primaryType: typedMessage.primaryType,
          });
          const result = await bridge.deviceSignTypedData({
            hdPath: params.hdPath,
            message: typedMessage,
          });
          return result;
        }

        case LedgerAction.signDelegationAuthorization: {
          if (
            !params?.hdPath ||
            typeof params.hdPath !== 'string' ||
            typeof params.chainId !== 'number' ||
            typeof params.contractAddress !== 'string' ||
            typeof params.nonce !== 'number'
          ) {
            throw createLedgerError(
              'Missing delegation authorization parameter',
            );
          }
          const delegationParams: LedgerSignDelegationAuthorizationParams = {
            hdPath: params.hdPath,
            chainId: params.chainId,
            contractAddress: params.contractAddress,
            nonce: params.nonce,
          };
          return await bridge.deviceSignDelegationAuthorization(
            delegationParams,
          );
        }

        default:
          throw createLedgerError(`Unknown Ledger action: ${action as string}`);
      }
    } catch (error) {
      throw toHardwareWalletError(
        error,
        ErrorCode.Unknown,
        'Ledger action failed',
        Category.Unknown,
      );
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
    this.bridgeGeneration += 1;
    this.removeDeviceEventListeners();
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
