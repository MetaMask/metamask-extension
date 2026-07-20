import {
  LedgerHandlerMode,
  LedgerAction,
  OffscreenCommunicationEvents,
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

    activeHandler
      .handleAction(action, params)
      .then((result) => {
        sendResponse({
          success: true,
          payload: result,
        });
      })
      .catch((error: unknown) => {
        sendResponse({
          success: false,
          payload: {
            error: serializeLedgerError(error),
          },
        });
      });

    return true;
  };

  chrome.runtime.onMessage.addListener(messageListener);
}

/**
 * Create a new handler for the given mode and initialise it.
 *
 * The central router owns the single `chrome.runtime.onMessage` listener
 * that dispatches to `handleAction()`, so handlers must not register their
 * own. DMK's `init(true)` skips its standalone listener; Legacy never had
 * one under the router model.
 *
 * @param mode - The handler implementation to construct. `DMK` instantiates
 * `LedgerDMKBridgeHandler`, any other value instantiates the legacy
 * `LedgerLegacyHandler`.
 * @returns Initialised handler ready to receive actions.
 */
async function createHandler(mode: LedgerHandlerMode): Promise<LedgerHandler> {
  if (mode === LedgerHandlerMode.DMK) {
    const handler = new LedgerDmkBridgeHandler();
    // Pass true so DMK does not register a competing onMessage listener.
    await handler.init(true);
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
    console.log('[ledger-router] initLedger', mode);
    const newHandler = await createHandler(mode);
    const previous = activeHandler;
    activeHandler = newHandler;
    currentMode = mode;
    ensureMessageListener();
    console.log('[ledger-router] initLedger complete', mode);

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
export function switchLedgerHandler(
  mode: LedgerHandlerMode,
): Promise<void> {
  const switchPromise = switchInProgress.then(() => performSwitch(mode));
  switchInProgress = switchPromise.catch(() => undefined);
  return switchPromise;
}

async function performSwitch(mode: LedgerHandlerMode): Promise<void> {
  if (initInProgress !== null) {
    await initInProgress;
  }

  if (!activeHandler) {
    console.log(
      '[ledger-router] switchLedgerHandler before init; bootstrapping Legacy first',
    );
    await initLedger(LedgerHandlerMode.Legacy);
  }

  if (mode === currentMode) {
    console.log('[ledger-router] switchLedgerHandler no-op; already', mode);
    return;
  }

  console.log(
    '[ledger-router] switching handler',
    `${currentMode ?? 'none'} → ${mode}`,
  );

  const newHandler = await createHandler(mode);
  const previous = activeHandler;
  activeHandler = newHandler;
  currentMode = mode;
  ensureMessageListener();

  if (previous) {
    await previous.destroy();
  }

  console.log('[ledger-router] switched handler to', mode);
}

/**
 * Bootstrap the Ledger handler in the offscreen document.
 *
 * Registers the mode-switch listener first so an initial `switchLedgerMode`
 * push from the background is not missed, then initialises the Legacy
 * handler as the default. Background may subsequently hot-swap to DMK when
 * the `ledgerDmk` remote feature flag is enabled.
 */
export async function bootstrapLedger(): Promise<void> {
  console.log('[ledger-router] bootstrapLedger starting (default Legacy)');
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
