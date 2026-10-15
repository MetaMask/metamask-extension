import {
  LedgerHandlerMode,
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import { serializeLedgerError } from './ledger-utils';
import initLegacy from './ledger';

/** Interface that both DMK and Legacy handlers share for action dispatch. */
type LedgerHandler = {
  init(): Promise<void>;
  destroy(): Promise<void>;
  handleAction(
    action: LedgerAction,
    params?: Record<string, unknown>,
  ): Promise<unknown>;
  /**
   * Best-effort synchronous reset of the underlying transport, invoked when an
   * action has wedged past its timeout. Drops transport/app references so the
   * next action opens a fresh transport instead of queuing behind the hung one.
   */
  forceReset?: () => void;
};

/** The currently-active ledger handler (DMK bridge or legacy). */
let activeHandler: LedgerHandler | null = null;

/** The active mode, used to avoid unnecessary re-initialisation on switch. */
let currentMode: LedgerHandlerMode | null = null;

type ChromeMessageListener = Parameters<
  typeof chrome.runtime.onMessage.addListener
>[0];

/** Reference to the router's own chrome.runtime.onMessage listener. */
let messageListener: ChromeMessageListener | null = null;

/** Whether the mode-switch listener has already been registered. */
let modeSwitchListenerRegistered = false;

/**
 * Serializes all Ledger actions through a single promise chain so concurrent
 * messages never overlap on the shared transport (which would reject with
 * `TransportLocked`). Each link races `handleAction` against a timeout so a
 * wedged offscreen WebHID round-trip rejects (unblocking later messages)
 * instead of stalling the chain forever; on timeout the handler is
 * force-reset so retries can open a fresh transport.
 */
let actionChain: Promise<unknown> = Promise.resolve();

/** Backstop timeout for non-signing actions (above the 30s bridge read timeout). */
export const READ_ACTION_TIMEOUT_MS = 60_000;
/** Backstop timeout for signing actions (above the 300s bridge sign timeout). */
export const SIGN_ACTION_TIMEOUT_MS = 330_000;
const SIGN_ACTIONS = new Set<LedgerAction>([
  LedgerAction.signTransaction,
  LedgerAction.signPersonalMessage,
  LedgerAction.signTypedData,
]);

function actionTimeoutMs(action: LedgerAction): number {
  return SIGN_ACTIONS.has(action)
    ? SIGN_ACTION_TIMEOUT_MS
    : READ_ACTION_TIMEOUT_MS;
}

/**
 * Race a Ledger action against a timeout without dropping the losing promise.
 *
 * Unlike `Promise.race`, this attaches a handler to the action promise so its
 * eventual settlement is always consumed. When the timeout wins, the in-flight
 * `handleAction` typically rejects a moment later once `forceReset` closes the
 * transport; without the attached handler that late rejection would surface as
 * unhandled. Mirrors `withTrezorDeviceTimeout`. On timeout the handler is
 * force-reset so the next action opens a fresh transport instead of queuing
 * behind the hung one.
 * @param handler
 * @param action
 * @param params
 */
function raceActionWithTimeout(
  handler: LedgerHandler,
  action: LedgerAction,
  params: Record<string, unknown> | undefined,
): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    const timeoutMs = actionTimeoutMs(action);
    const timer = setTimeout(() => {
      handler.forceReset?.();
      reject(
        new Error(`Ledger action "${action}" timed out after ${timeoutMs}ms`),
      );
    }, timeoutMs);

    handler.handleAction(action, params).then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Tracks the in-flight `initLedger` call.  When `switchLedgerHandler` is
 * invoked while `initLedger` has not yet finished, it awaits this promise
 * first so it sees the correct `activeHandler` and `currentMode` instead
 * of creating a duplicate Legacy handler.
 */
let initInProgress: Promise<void> | null = null;

/** Serializes handler switches so the latest requested mode wins in order. */
let switchInProgress: Promise<void> = Promise.resolve();

/**
 * Idempotently registers the central message listener that dispatches every
 * `ledger-offscreen` action to `activeHandler`.
 *
 * The listener closes over the module-level `activeHandler` binding rather
 * than a specific handler instance, so it does NOT need to be re-registered
 * when the handler is swapped — `switchLedgerHandler` simply reassigns
 * `activeHandler` and the next incoming message is routed to the new handler.
 * This keeps the swap atomic and avoids any window in which no listener is
 * attached.
 */
function ensureMessageListener(): void {
  if (messageListener) {
    return;
  }

  messageListener = (
    message: Record<string, unknown>,
    _sender: unknown,
    sendResponse: (response?: unknown) => void,
  ): boolean => {
    if (
      message.target !== OffscreenCommunicationTarget.ledgerOffscreen ||
      typeof message.action !== 'string'
    ) {
      return false;
    }

    if (!activeHandler) {
      sendResponse({
        success: false,
        payload: { error: { message: 'No active Ledger handler' } },
      });
      return true;
    }

    const action = message.action as LedgerAction;
    const params =
      message.params && typeof message.params === 'object'
        ? (message.params as Record<string, unknown>)
        : undefined;

    // Chain onto the in-flight action so concurrent messages never overlap on
    // the shared transport. Race the offscreen link against a timeout so a
    // wedged action rejects (freeing the chain) instead of stalling it; on
    // timeout, force-reset the handler so retries open a fresh transport.
    const handler = activeHandler;
    actionChain = actionChain
      .then(() => raceActionWithTimeout(handler, action, params))
      .then(
        (result) => {
          sendResponse({ success: true, payload: result });
        },
        (error: unknown) => {
          sendResponse({
            success: false,
            payload: { error: serializeLedgerError(error) },
          });
        },
      );

    return true;
  };

  chrome.runtime.onMessage.addListener(messageListener);
}

/**
 * Create a new handler for the given mode and initialise it.
 *
 * The central router owns the single `chrome.runtime.onMessage` listener
 * that dispatches to `handleAction()`, so the handler does not register its
 * own.
 *
 * DMK is loaded via dynamic `import()` so a module-eval failure in the DMK
 * dependency graph (e.g. under LavaMoat) cannot take down the whole offscreen
 * document (snaps, Trezor, Lattice, legacy Ledger).
 *
 * @param mode - The handler implementation to construct. `DMK` instantiates
 * `LedgerDmkBridgeHandler`, any other value instantiates the legacy
 * `LedgerLegacyHandler`.
 * @returns Initialised handler ready to receive actions.
 */
async function createHandler(mode: LedgerHandlerMode): Promise<LedgerHandler> {
  if (mode === LedgerHandlerMode.DMK) {
    // eslint-disable-next-line import-x/extensions
    const { LedgerDmkBridgeHandler } = await import('./ledger-dmk-handler.ts');
    const handler = new LedgerDmkBridgeHandler();
    await handler.init();
    return handler;
  }

  const handler = initLegacy();
  await handler.init();
  return handler;
}

/**
 * Returns true when `mode` is a known {@link LedgerHandlerMode} value.
 *
 * @param mode - Candidate mode from an untrusted message payload.
 */
function isLedgerHandlerMode(mode: unknown): mode is LedgerHandlerMode {
  return mode === LedgerHandlerMode.DMK || mode === LedgerHandlerMode.Legacy;
}

/**
 * Registers a listener for `switchLedgerMode` events from the background
 * service worker so the offscreen document can hot-swap handlers when the
 * `ledgerDmk` remote feature flag changes.
 *
 * Idempotent — safe to call more than once.
 */
function listenForModeSwitches(): void {
  if (modeSwitchListenerRegistered) {
    return;
  }
  modeSwitchListenerRegistered = true;

  chrome.runtime.onMessage.addListener(
    (message: Record<string, unknown>): undefined => {
      if (
        message.target !== OffscreenCommunicationTarget.extension ||
        message.event !== OffscreenCommunicationEvents.switchLedgerMode
      ) {
        return undefined;
      }

      if (!isLedgerHandlerMode(message.mode)) {
        console.error(
          '[ledger-router] ignore switchLedgerMode with invalid mode:',
          message.mode,
        );
        return undefined;
      }

      console.log(
        '[ledger-router] received switchLedgerMode',
        message.mode,
        `(current: ${currentMode ?? 'none'})`,
      );

      switchLedgerHandler(message.mode).catch((error: unknown) => {
        console.error('[ledger-router] switchLedgerHandler failed:', error);
      });

      return undefined;
    },
  );
}

/**
 * Notifies the background that the mode-switch listener is ready.
 *
 * This explicit handshake lets the background resend the current mode if its
 * initial message was sent after createOffscreen() timed out but before this
 * router had finished booting.
 */
function notifyModeSwitchListenerReady(): void {
  chrome.runtime.sendMessage({
    target: OffscreenCommunicationTarget.extensionMain,
    event: OffscreenCommunicationEvents.ledgerModeReady,
  });
}

/**
 * Retires a handler after it has been swapped out of `activeHandler`.
 *
 * Destroy is fire-and-forget: WebHID `destroy()`/`close()` can hang (see
 * `forceReset`), and awaiting it here would permanently stick `switchInProgress`
 * / `initInProgress` so later mode swaps never run. Sync cleanup inside
 * `destroy()` still runs before the first await (HID listeners, transport
 * refs); only the hung close stays in the background.
 *
 * @param handler - The handler that was just swapped out.
 */
function retireHandler(handler: LedgerHandler): void {
  Promise.resolve(handler.destroy()).catch((error: unknown) => {
    console.error('[ledger-router] previous handler destroy failed:', error);
  });
}

/**
 * Initialises the Ledger offscreen handler for the first time.
 *
 * Registers a central `chrome.runtime.onMessage` listener (idempotently) and
 * creates the appropriate handler (DMK bridge or legacy).
 *
 * @param mode - The handler implementation to bootstrap. See `createHandler`.
 */
export default async function initLedger(
  mode: LedgerHandlerMode,
): Promise<void> {
  const promise = (async () => {
    const newHandler = await createHandler(mode);
    const previous = activeHandler;
    activeHandler = newHandler;
    currentMode = mode;
    ensureMessageListener();

    if (previous) {
      retireHandler(previous);
    }
  })();

  initInProgress = promise;
  try {
    await promise;
  } finally {
    if (initInProgress === promise) {
      initInProgress = null;
    }
  }
}

/**
 * Dynamically switch the active Ledger handler at runtime.
 *
 * Creates the new handler first, atomically swaps it into `activeHandler`
 * (zero gap — no message loss window, the listener is not touched), then
 * retires the old handler without awaiting destroy (WebHID close can hang;
 * see `retireHandler`). If creation throws, the old handler stays intact.
 *
 * If called before any handler has been initialised (e.g., a
 * `switchLedgerMode` event arrives during bootstrap before `initLedger`
 * has run), Legacy is used as the default starting mode and then the
 * switch proceeds normally.
 *
 * Switching to the same mode is a safe no-op. Concurrent switches are
 * serialized so the latest requested mode wins in order.
 *
 * @param mode - The handler implementation to switch to. See `createHandler`.
 */
export function switchLedgerHandler(mode: LedgerHandlerMode): Promise<void> {
  const switchPromise = switchInProgress.then(() => performSwitch(mode));
  switchInProgress = switchPromise.catch(() => undefined);
  return switchPromise;
}

async function performSwitch(mode: LedgerHandlerMode): Promise<void> {
  if (initInProgress !== null) {
    await initInProgress;
  }

  if (!activeHandler) {
    await initLedger(LedgerHandlerMode.Legacy);
  }

  if (mode === currentMode) {
    return;
  }

  const newHandler = await createHandler(mode);
  const previous = activeHandler;
  activeHandler = newHandler;
  currentMode = mode;
  ensureMessageListener();

  if (previous) {
    retireHandler(previous);
  }
}

/**
 * Bootstrap the Ledger handler in the offscreen document.
 *
 * Registers the mode-switch listener first so an initial `switchLedgerMode`
 * push from the background is not missed, then initialises the Legacy
 * handler as the default. Background may subsequently hot-swap to DMK when
 * the `ledgerDmk` remote feature flag is enabled. Emits `ledgerModeReady`
 * after bootstrap so the background can resend the current mode if needed.
 */
export async function bootstrapLedger(): Promise<void> {
  listenForModeSwitches();

  try {
    await initLedger(LedgerHandlerMode.Legacy);
  } catch (error) {
    // Initialisation failed — Ledger will not be available for this session.
    // Logged so a real device failure is observable from the offscreen
    // DevTools console instead of failing silently.
    console.error('[ledger-router] bootstrapLedger failed:', error);
  }

  notifyModeSwitchListenerReady();
}
