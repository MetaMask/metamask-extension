/**
 * Real Ledger DMK (Device Management Kit) offscreen handler.
 *
 * Loaded by the offscreen router via dynamic `import('./ledger-dmk-handler.ts')`
 * so a module-eval failure in the DMK dependency graph cannot take down the
 * rest of the offscreen document. Mode selection is gated by the `ledgerDmk`
 * remote feature flag.
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
 * @param originalFactory - The upstream WebHID transport factory.
 * @param onTransportCreated - Invoked with each transport the DMK builds, so
 * the caller can destroy it during teardown. The DMK never destroys its
 * transports, and `WebHidTransport` registers `navigator.hid` listeners in its
 * constructor, so without this hook every rebuilt bridge permanently leaks a
 * listener pair into the long-lived offscreen document.
 */
function createOffscreenTransportFactory(
  originalFactory: typeof webHidTransportFactory,
  onTransportCreated: (transport: DestroyableTransport) => void,
): typeof webHidTransportFactory {
  return ((deps: Parameters<typeof originalFactory>[0]) => {
    const transport = originalFactory(deps);
    transport.startDiscovering = () =>
      transport
        .listenToAvailableDevices()
        .pipe(mergeMap((devices) => from(devices)));
    onTransportCreated(transport as DestroyableTransport);
    return transport;
  }) as typeof webHidTransportFactory;
}

type LedgerDevice = Parameters<DeviceManagementKit['connect']>[0]['device'];

/**
 * A DMK transport that may expose a synchronous `destroy()`.
 *
 * `destroy()` is not part of the DMK `Transport` interface, but
 * `WebHidTransport` implements it and it is the only way to abort the
 * `navigator.hid` connect/disconnect listeners that the transport registers
 * in its constructor. Neither `bridge.destroy()` (which only calls
 * `dmk.disconnect({ sessionId })`) nor `dmk.close()` (which only closes
 * device *sessions*) tears those listeners down.
 */
type DestroyableTransport = ReturnType<typeof webHidTransportFactory> & {
  destroy?: () => void;
};

/**
 * Destroys a DMK transport if it supports it, swallowing any failure.
 *
 * `WebHidTransport.destroy()` is synchronous and non-throwing (it aborts an
 * `AbortController` and calls `closeConnection()` on each device connection,
 * which internally catches `HIDDevice.close()` rejections), but the DMK
 * `Transport` interface makes no such guarantee, so failures are contained
 * here rather than surfacing into a teardown path.
 *
 * @param transport - The transport created for a bridge, if captured.
 */
function destroyTransport(transport: DestroyableTransport | null): void {
  if (typeof transport?.destroy !== 'function') {
    return;
  }

  try {
    transport.destroy();
  } catch (error) {
    console.error('[LedgerDMK] Error destroying transport', error);
  }
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

  // Devices permitted when the cached bridge connected.
  // Re-granting permission creates new HIDDevice objects.
  #bridgeHidDevices: Set<HIDDevice> | null = null;

  #sessionStateSubscription: Subscription | null = null;

  // Transport created by the cached bridge's DMK. Held so teardown can call
  // `destroy()` on it; see `destroyTransport`.
  #bridgeTransport: DestroyableTransport | null = null;

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
   * Cached bridges are liveness-checked first: revoking the WebHID permission
   * grant (e.g. from browser settings) does not fire a native `disconnect`
   * event, so without this check a stale bridge would survive and every later
   * action would fail against it instead of re-running device discovery.
   *
   * @returns A connected `LedgerDmkBridge`.
   */
  async #ensureBridge(): Promise<LedgerDmkBridge> {
    // Detect a stale cached bridge. Revoking the WebHID permission grant
    // (e.g. removing the device in chrome://settings) does NOT fire a native
    // `disconnect` event, so `#setupDisconnectMonitoring` never tears the
    // bridge down in that case.
    //
    // Why tear down rather than leave it cached:
    // 1. The bridge is already dead, not just unauthorized — its captured
    //    `HIDDevice` can no longer send/receive reports, so it will fail on
    //    the very next APDU call regardless. Keeping it cached preserves
    //    nothing useful.
    // 2. Leaving it alive leaks resources: its `onSessionStateChange`
    //    subscription and the DMK's internal `DeviceConnectionStateMachine`
    //    reconnect timers keep running against a device that no longer
    //    exists from our side.
    // 3. If the user later re-grants permission, the browser hands back a
    //    *new* `HIDDevice` object — the old bridge's captured device
    //    reference can never be revived, so it has to be rebuilt from
    //    scratch either way. Tearing down now just makes that explicit.
    //
    // Falling through to the normal construction path after teardown lets
    // discovery re-run, reusing the existing `#findPermittedDevice()` path
    // (yielding the canonical "No permitted Ledger device found" error when
    // no device is actually available, instead of duplicating that error
    // construction here).
    if (this.#bridge) {
      // Apply the result only to the bridge being checked.
      const checkedBridge = this.#bridge;
      const hasPermittedDevice = await this.#hasPermittedLedgerDevice();
      if (!hasPermittedDevice && this.#bridge === checkedBridge) {
        // Do not wait for cleanup of an unresponsive device.
        const bridgeToDestroy = this.#clearBridgeState();
        if (bridgeToDestroy) {
          Promise.resolve(bridgeToDestroy.destroy()).catch(() => {
            // Best-effort cleanup of the stale bridge.
          });
        }
      }
    }

    if (this.#bridge) {
      return this.#bridge;
    }
    if (this.#bridgePromise !== null) {
      return this.#bridgePromise;
    }

    const generation = this.#bridgeGeneration;
    const pending = this.#constructBridge()
      .then(async ({ bridge, transport }) => {
        // `destroy()` may have cleared state while construction was in flight.
        // Discard the orphaned bridge instead of resurrecting a torn-down handler.
        if (generation !== this.#bridgeGeneration) {
          destroyTransport(transport);
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
        this.#bridgeTransport = transport;
        return bridge;
      })
      .catch((error: unknown) => {
        console.error('[LedgerDMK] ensureBridge: connect failed', error);
        if (generation === this.#bridgeGeneration) {
          this.#bridgePromise = null;
          this.#sessionId = null;
          this.#bridgeHidDevices = null;
          this.#bridgeTransport = null;
        }
        throw toHardwareWalletError(error, HardwareWalletType.Ledger);
      });

    this.#bridgePromise = pending;
    return pending;
  }

  /**
   * Checks whether a device used by the cached bridge is still permitted.
   * Falls back to the vendor ID when no device snapshot is available.
   *
   * @returns Whether the bridge may still be valid.
   */
  async #hasPermittedLedgerDevice(): Promise<boolean> {
    if (!isWebHIDSupported()) {
      return true;
    }

    try {
      const devices = await navigator.hid.getDevices();
      const bridgeDevices = this.#bridgeHidDevices;
      if (bridgeDevices) {
        return devices.some((device) => bridgeDevices.has(device));
      }
      return devices.some(
        (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
      );
    } catch (error) {
      console.error(
        '[LedgerDMK] Error checking for permitted Ledger devices:',
        error,
      );
      return true;
    }
  }

  /**
   * Gets permitted Ledger devices for identity checks.
   *
   * @returns The devices, or null when unavailable.
   */
  async #getPermittedLedgerHidDevices(): Promise<Set<HIDDevice> | null> {
    if (!isWebHIDSupported()) {
      return null;
    }

    try {
      const devices = await navigator.hid.getDevices();
      const ledgerDevices = devices.filter(
        (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
      );
      return ledgerDevices.length > 0 ? new Set(ledgerDevices) : null;
    } catch (error) {
      console.error(
        '[LedgerDMK] Error capturing permitted Ledger devices:',
        error,
      );
      return null;
    }
  }

  /**
   * Constructs a fresh `LedgerDmkBridge`, discovers a permitted device,
   * connects, and waits for session readiness.
   *
   * The transport is returned alongside the bridge rather than assigned to
   * `#bridgeTransport` here: concurrent constructions (e.g. a stale-bridge
   * rebuild racing a `destroy()`) would otherwise overwrite each other's
   * transport reference and leak the loser's `navigator.hid` listeners.
   *
   * @returns A connected `LedgerDmkBridge` and the transport its DMK created.
   */
  async #constructBridge(): Promise<{
    bridge: LedgerDmkBridge;
    transport: DestroyableTransport | null;
  }> {
    console.log('[LedgerDMK] constructBridge: creating LedgerDmkBridge');
    let transport: DestroyableTransport | null = null;
    const offscreenTransportFactory = createOffscreenTransportFactory(
      webHidTransportFactory,
      (createdTransport) => {
        transport = createdTransport;
      },
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

      // Save device identities to detect revoke and re-grant.
      this.#bridgeHidDevices = await this.#getPermittedLedgerHidDevices();

      // `connect()` sets isConnected synchronously and starts session monitoring.
      // The bridge's signing methods handle device-action completion internally
      // via waitForDeviceAction, so no explicit readiness wait is needed here.
      // (onSessionStateChange is a Subject, not BehaviorSubject — subscribing
      // after connect() would miss the initial emission.)
      console.log('[LedgerDMK] constructBridge: session ready', {
        sessionId: this.#sessionId,
      });

      return { bridge, transport };
    } catch (error) {
      // Discovery/connect failures must not leave an orphaned DMK instance in
      // the long-lived offscreen document (HID state, transports, etc.).
      //
      // Destroy the transport *before* awaiting `bridge.destroy()`: this
      // transport was never published to `#bridgeTransport`, so
      // `#clearBridgeState()` cannot abort it, and `bridge.destroy()` can hang
      // indefinitely against a permission-revoked device — leaving the
      // transport's `navigator.hid` listeners registered forever.
      destroyTransport(transport);
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
   * Synchronously clears the cached bridge, session id, pending
   * bridge-construction promise, and session-state subscription, and bumps
   * `bridgeGeneration` so in-flight `constructBridge()` calls are discarded.
   *
   * Shared by every teardown path (`#tearDownBridge`, `forceReset`, the
   * liveness-check rebuild in `#ensureBridge`) so `ensureBridge()` never
   * returns a mid-destroy bridge, regardless of how destroy is awaited.
   *
   * The transport is destroyed here too, synchronously, so the
   * `navigator.hid` listeners it registered are gone even on the paths that
   * fire-and-forget `bridge.destroy()`. A later `dmk.disconnect()` against the
   * destroyed transport is a no-op, not an error.
   *
   * @returns The bridge that was cached, if any, for the caller to destroy.
   */
  #clearBridgeState(): LedgerDmkBridge | null {
    this.#bridgeGeneration += 1;
    if (this.#sessionStateSubscription) {
      this.#sessionStateSubscription.unsubscribe();
      this.#sessionStateSubscription = null;
    }

    const bridgeToDestroy = this.#bridge;
    destroyTransport(this.#bridgeTransport);
    // Clear synchronously before any await so concurrent ensureBridge()
    // callers construct a fresh bridge instead of reusing one mid-destroy.
    this.#bridge = null;
    this.#bridgePromise = null;
    this.#sessionId = null;
    this.#bridgeHidDevices = null;
    this.#bridgeTransport = null;

    return bridgeToDestroy;
  }

  /**
   * Tears down the cached bridge and session state without removing the
   * HID device-event listeners.
   *
   * Used on device disconnect: the router keeps the same handler instance,
   * so the HID listeners must stay registered to detect replug.
   */
  async #tearDownBridge(): Promise<void> {
    const bridgeToDestroy = this.#clearBridgeState();

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
   * Best-effort synchronous reset of the cached bridge, invoked when a router
   * action has wedged past its timeout. Destroy is fire-and-forget so the
   * next action doesn't queue behind a hung `destroy()`.
   */
  forceReset(): void {
    const bridgeToDestroy = this.#clearBridgeState();

    if (!bridgeToDestroy) {
      return;
    }

    Promise.resolve(bridgeToDestroy.destroy()).catch(() => {
      /* best-effort: ignore destroy failures during forced reset */
    });
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
