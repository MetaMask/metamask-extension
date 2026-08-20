import {
  LedgerHandlerMode,
  LedgerAction,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import { LedgerDmkBridgeHandler } from './ledger-dmk';
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
 * @param mode - The handler implementation to construct. `DMK` instantiates
 * `LedgerDmkBridgeHandler`, any other value instantiates the legacy
 * `LedgerLegacyHandler`.
 * @returns Initialised handler ready to receive actions.
 */
async function createHandler(mode: LedgerHandlerMode): Promise<LedgerHandler> {
  if (mode === LedgerHandlerMode.DMK) {
    const handler = new LedgerDmkBridgeHandler();
    await handler.init();
    return handler;
  }

  const handler = initLegacy();
  await handler.init();
  return handler;
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
      await previous.destroy();
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
 * lazily destroys the old handler.  If creation throws, the old handler
 * stays intact.
 *
 * If called before any handler has been initialised (e.g., a
 * `switchLedgerMode` event arrives during bootstrap before `initLedger`
 * has run), Legacy is used as the default starting mode and then the
 * switch proceeds normally.
 *
 * Switching to the same mode is a safe no-op.
 *
 * @param mode - The handler implementation to switch to. See `createHandler`.
 */
export async function switchLedgerHandler(
  mode: LedgerHandlerMode,
): Promise<void> {
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
    await previous.destroy();
  }
}

/**
 * Bootstrap the Ledger handler in the offscreen document.
 *
 * Initialises the Legacy handler immediately as the default. Remote
 * feature-flag driven mode switching is wired in a follow-up PR.
 */
export async function bootstrapLedger(): Promise<void> {
  try {
    await initLedger(LedgerHandlerMode.Legacy);
  } catch (error) {
    // Initialisation failed — Ledger will not be available for this session.
    // Logged so a real device failure is observable from the offscreen
    // DevTools console instead of failing silently.
    console.error('[ledger-router] bootstrapLedger failed:', error);
  }
}
