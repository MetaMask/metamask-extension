/**
 * Real Ledger DMK (Device Management Kit) offscreen handler.
 *
 * NOT YET WIRED: no bundle entry point imports this module, so the DMK
 * dependency graph (`@ledgerhq/*`, `rxjs`, inversify) stays out of the build
 * and no LavaMoat policy entries are required yet. Only Jest imports it. A
 * follow-up PR replaces the `ledger-dmk.ts` stub with this implementation and
 * wires it into the offscreen router (via dynamic `import()`), landing the
 * generated policies alongside that first reachable import.
 */
import {
  LedgerDmkBridge,
  LedgerSignTypedDataParams,
} from '@metamask/eth-ledger-bridge-keyring';

import { DeviceManagementKit } from '@ledgerhq/device-management-kit';
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
  HardwareWalletType,
  toHardwareWalletError,
} from '../../../shared/lib/hardware-wallets';
import {
  LEDGER_DEVICE_DISCOVERY_TIMEOUT_MS,
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import { LEDGER_USB_VENDOR_ID } from '../../../shared/constants/hardware-wallets';

function isWebHIDSupported(): boolean {
  return navigator?.hid !== undefined;
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
      transport
        .listenToAvailableDevices()
        .pipe(mergeMap((devices) => from(devices)));
    return transport;
  }) as typeof webHidTransportFactory;
}

type LedgerDevice = Parameters<DeviceManagementKit['connect']>[0]['device'];

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

type ActionParamType = 'string' | 'number' | 'object';

type ActionParamsFromShape<Shape extends Record<string, ActionParamType>> = {
  [Key in keyof Shape]: Shape[Key] extends 'string'
    ? string
    : Shape[Key] extends 'number'
      ? number
      : object;
};

/**
 * Validates that `params` includes every field in `shape` with the expected
 * runtime type. String fields must also be non-empty; `null` is rejected for
 * object fields.
 *
 * @param params - Action params bag from the offscreen message.
 * @param shape - Map of required field name → expected `typeof` result.
 * @param errorMessage - Error thrown when validation fails.
 * @returns The same params object, narrowed to the required field types.
 */
function requireActionParams<
  const Shape extends Record<string, ActionParamType>,
>(
  params: Record<string, unknown> | undefined,
  shape: Shape,
  errorMessage: string,
): ActionParamsFromShape<Shape> {
  if (!params) {
    throw createLedgerError(errorMessage);
  }

  for (const key of Object.keys(shape) as (keyof Shape & string)[]) {
    const expectedType = shape[key];
    const value = params[key];

    if (typeof value !== expectedType) {
      throw createLedgerError(errorMessage);
    }
    if (expectedType === 'string' && value === '') {
      throw createLedgerError(errorMessage);
    }
    if (expectedType === 'object' && value === null) {
      throw createLedgerError(errorMessage);
    }
  }

  return params as ActionParamsFromShape<Shape>;
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
  return toHardwareWalletError(reason, HardwareWalletType.Ledger);
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
  #bridge: LedgerDmkBridge | null = null;

  #bridgePromise: Promise<LedgerDmkBridge> | null = null;

  /**
   * Bumped in `destroy()` so in-flight `constructBridge()` results are discarded
   * instead of resurrecting a torn-down handler.
   */
  #bridgeGeneration = 0;

  #sessionId: string | null = null;

  #sessionStateSubscription: Subscription | null = null;

  // Stored references to `navigator.hid` listeners so `destroy()` can remove
  // them. Without these references the listeners leak for the lifetime of the
  // offscreen document when handlers are hot-swapped via `switchLedgerHandler`.
  #hidConnectListener: ((event: { device: HIDDevice }) => void) | null = null;

  #hidDisconnectListener: ((event: { device: HIDDevice }) => void) | null =
    null;

  /**
   * Lazily creates and caches the `LedgerDmkBridge` instance.
   * Deduplicates concurrent calls via `bridgePromise`.
   *
   * @returns A connected `LedgerDmkBridge`.
   */
  async #ensureBridge(): Promise<LedgerDmkBridge> {
    if (this.#bridge) {
      return this.#bridge;
    }
    if (this.#bridgePromise !== null) {
      return this.#bridgePromise;
    }

    const generation = this.#bridgeGeneration;
    const pending = this.#constructBridge()
      .then(async (bridge) => {
        // `destroy()` may have cleared state while construction was in flight.
        // Discard the orphaned bridge instead of resurrecting a torn-down handler.
        if (generation !== this.#bridgeGeneration) {
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
        // Only subscribe after the generation check. Doing this inside
        // `constructBridge` lets an orphan re-attach monitoring; a later
        // `bridge.destroy()` can emit `connected: false` and run
        // `tearDownBridge()`, bumping generation and clearing a newer
        // in-flight `bridgePromise`.
        this.#setupDisconnectMonitoring(bridge);
        this.#bridge = bridge;
        return bridge;
      })
      .catch((error: unknown) => {
        console.error('[LedgerDMK] ensureBridge: connect failed', error);
        if (generation === this.#bridgeGeneration) {
          this.#bridgePromise = null;
          this.#sessionId = null;
        }
        throw toHardwareWalletError(error, HardwareWalletType.Ledger);
      });

    this.#bridgePromise = pending;
    return pending;
  }

  /**
   * Constructs a fresh `LedgerDmkBridge`, discovers a permitted device,
   * connects, and waits for session readiness.
   *
   * @returns A connected `LedgerDmkBridge`.
   */
  async #constructBridge(): Promise<LedgerDmkBridge> {
    console.log('[LedgerDMK] constructBridge: creating LedgerDmkBridge');
    const offscreenTransportFactory = createOffscreenTransportFactory(
      webHidTransportFactory,
    );
    const bridge = new LedgerDmkBridge({
      // Wrapped so `startDiscovering` uses already-permitted devices via
      // `getDevices()` (no user gesture) instead of `requestDevice()`, which
      // always fails in the offscreen document.
      transportFactory: offscreenTransportFactory,
    });

    try {
      console.log('[LedgerDMK] constructBridge: finding permitted device');
      const device = await this.#findPermittedDevice(bridge);
      console.log('[LedgerDMK] constructBridge: connecting to device');
      this.#sessionId = await bridge.connect({ device });

      // `connect()` sets isConnected synchronously and starts session monitoring.
      // The bridge's signing methods handle device-action completion internally
      // via waitForDeviceAction, so no explicit readiness wait is needed here.
      // (onSessionStateChange is a Subject, not BehaviorSubject — subscribing
      // after connect() would miss the initial emission.)
      console.log('[LedgerDMK] constructBridge: session ready', {
        sessionId: this.#sessionId,
      });

      return bridge;
    } catch (error) {
      // Discovery/connect failures must not leave an orphaned DMK instance in
      // the long-lived offscreen document (HID state, transports, etc.).
      try {
        await bridge.destroy();
      } catch {
        // Best-effort cleanup of a partially constructed bridge.
      }
      throw error;
    }
  }

  /**
   * Subscribes to `onSessionStateChange` to detect device disconnects.
   * On disconnect, tears down the cached bridge so the next action triggers
   * a fresh connection — but keeps the HID device-event listeners registered
   * so replug still fires `ledgerDeviceConnect`.
   *
   * The router reuses the same handler instance across disconnect/replug
   * cycles, so a full `destroy()` here would strip the HID listeners and the
   * extension would stop receiving connect events until the handler was
   * recreated. `tearDownBridge()` avoids that by preserving listeners.
   * @param bridge
   */
  #setupDisconnectMonitoring(bridge: LedgerDmkBridge): void {
    if (this.#sessionStateSubscription) {
      this.#sessionStateSubscription.unsubscribe();
    }
    this.#sessionStateSubscription = bridge.onSessionStateChange.subscribe({
      next: ({ connected }) => {
        if (!connected) {
          this.#tearDownBridge().catch(() => {
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
  async #findPermittedDevice(bridge: LedgerDmkBridge): Promise<LedgerDevice> {
    return firstValueFrom(
      bridge.startDiscovering({}).pipe(
        timeoutOperator(LEDGER_DEVICE_DISCOVERY_TIMEOUT_MS),
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
  #setupDeviceEventListeners(): void {
    if (!isWebHIDSupported()) {
      return;
    }

    // Avoid stacking duplicate listeners if init() is called more than once.
    this.#removeDeviceEventListeners();

    this.#hidConnectListener = ({ device }: { device: HIDDevice }) => {
      if (device.vendorId === Number(LEDGER_USB_VENDOR_ID)) {
        chrome.runtime.sendMessage({
          target: OffscreenCommunicationTarget.extension,
          event: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: true,
        });
      }
    };

    this.#hidDisconnectListener = ({ device }: { device: HIDDevice }) => {
      if (device.vendorId === Number(LEDGER_USB_VENDOR_ID)) {
        chrome.runtime.sendMessage({
          target: OffscreenCommunicationTarget.extension,
          event: OffscreenCommunicationEvents.ledgerDeviceConnect,
          payload: false,
        });
      }
    };

    navigator.hid.addEventListener('connect', this.#hidConnectListener);
    navigator.hid.addEventListener('disconnect', this.#hidDisconnectListener);
  }

  /**
   * Removes HID connect/disconnect listeners registered by this handler.
   */
  #removeDeviceEventListeners(): void {
    if (!isWebHIDSupported()) {
      return;
    }

    if (this.#hidConnectListener) {
      navigator.hid.removeEventListener('connect', this.#hidConnectListener);
      this.#hidConnectListener = null;
    }

    if (this.#hidDisconnectListener) {
      navigator.hid.removeEventListener(
        'disconnect',
        this.#hidDisconnectListener,
      );
      this.#hidDisconnectListener = null;
    }
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
      // updateTransport is a no-op in DMK (WebHID only). Short-circuit before
      // ensureBridge() so it doesn't trigger device discovery/connection,
      // matching the legacy handler's immediate `return true`.
      if (action === LedgerAction.updateTransport) {
        return true;
      }

      const bridge = await this.#ensureBridge();

      switch (action) {
        case LedgerAction.makeApp:
          // DMK auto-opens the ETH app on each signing operation, so makeApp
          // only needs to verify the device is reachable and the ETH app is
          // open. Returns a boolean to honor the Promise<boolean> contract
          // shared with the legacy handler and the main-thread bridge.
          await bridge.getAppNameAndVersion();
          return true;

        case LedgerAction.getAppNameAndVersion:
          return await bridge.getAppNameAndVersion();

        case LedgerAction.getAppConfiguration:
          return await bridge.getAppConfiguration();

        case LedgerAction.getPublicKey: {
          const { hdPath } = requireActionParams(
            params,
            { hdPath: 'string' },
            'Missing hdPath parameter',
          );
          return await bridge.getPublicKey({ hdPath });
        }

        case LedgerAction.signTransaction: {
          const { hdPath, tx } = requireActionParams(
            params,
            { hdPath: 'string', tx: 'string' },
            'Missing hdPath or tx parameter',
          );
          const result = await bridge.deviceSignTransaction({
            tx,
            hdPath,
          });
          return result;
        }

        case LedgerAction.signPersonalMessage: {
          const { hdPath, message } = requireActionParams(
            params,
            { hdPath: 'string', message: 'string' },
            'Missing hdPath or message parameter',
          );
          const result = await bridge.deviceSignMessage({
            hdPath,
            message,
          });
          return result;
        }

        case LedgerAction.signTypedData: {
          const { hdPath, message } = requireActionParams(
            params,
            { hdPath: 'string', message: 'object' },
            'Missing hdPath or message parameter',
          );
          const typedMessage = message as LedgerSignTypedDataParams['message'];
          console.log('[LedgerDMK] signTypedData start', {
            hdPath,
            primaryType: typedMessage.primaryType,
          });
          const result = await bridge.deviceSignTypedData({
            hdPath,
            message: typedMessage,
          });
          return result;
        }

        default:
          throw createLedgerError(`Unknown Ledger action: ${action as string}`);
      }
    } catch (error) {
      throw toHardwareWalletError(error, HardwareWalletType.Ledger);
    }
  }

  /**
   * Initializes the handler.
   *
   * Wires up `navigator.hid` device event listeners and notifies the
   * extension if a Ledger device is already permitted. The central router
   * (`ledger-router.ts`) owns the `chrome.runtime.onMessage` listener and
   * dispatches actions to `handleAction`, so this method does not register
   * any message listener itself.
   */
  async init(): Promise<void> {
    this.#setupDeviceEventListeners();

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
   * Tears down the cached bridge and session state without removing the
   * HID device-event listeners.
   *
   * Used on device disconnect: the router keeps the same handler instance,
   * so the HID listeners must stay registered to detect replug. Bumping
   * `bridgeGeneration` also discards any in-flight `constructBridge()`
   * result so it cannot resurrect the torn-down bridge.
   *
   * Bridge references are cleared synchronously before awaiting
   * `bridge.destroy()`, matching the legacy handler's `closeTransport()`.
   * That way `ensureBridge()` never returns a mid-destroy bridge, and a
   * hung `destroy()` cannot permanently stick callers on a dead instance.
   */
  async #tearDownBridge(): Promise<void> {
    this.#bridgeGeneration += 1;
    if (this.#sessionStateSubscription) {
      this.#sessionStateSubscription.unsubscribe();
      this.#sessionStateSubscription = null;
    }

    const bridgeToDestroy = this.#bridge;
    // Clear synchronously before the first await so concurrent ensureBridge()
    // callers construct a fresh bridge instead of reusing one mid-destroy.
    this.#bridge = null;
    this.#bridgePromise = null;
    this.#sessionId = null;

    if (!bridgeToDestroy) {
      return;
    }

    try {
      await bridgeToDestroy.destroy();
    } catch {
      // Bridge cleanup failed; nothing to recover here.
    }
  }

  /**
   * Destroys the cached bridge and cleans up subscriptions and listeners.
   *
   * Removes the HID device-event listeners in addition to the bridge teardown
   * performed by `tearDownBridge()`. Use this when the handler is being
   * retired (e.g. during `switchLedgerHandler`), not for a device disconnect —
   * see `setupDisconnectMonitoring`. Safe to call multiple times.
   */
  async destroy(): Promise<void> {
    this.#removeDeviceEventListeners();
    await this.#tearDownBridge();
  }
}
