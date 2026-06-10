import {
  LedgerHandlerMode,
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import { LedgerDMKBridgeHandler, serializeLedgerError } from './ledger-dmk';
import initLegacy from './ledger';

/** Interface that both DMK and Legacy handlers share for action dispatch. */
type LedgerHandler = {
  init(skipMessageListener?: boolean): Promise<void>;
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

/** Reference to the router's own chrome.runtime.onMessage listener. */
let messageListener:
  | ((
      msg: Record<string, unknown>,
      sender: unknown,
      sendResponse: (response: unknown) => void,
    ) => boolean)
  | null = null;

/**
 * Tracks the in-flight `initLedger` call.  When `switchLedgerHandler` is
 * invoked while `initLedger` has not yet finished, it awaits this promise
 * first so it sees the correct `activeHandler` and `currentMode` instead
 * of creating a duplicate Legacy handler.
 */
let initInProgress: Promise<void> | null = null;

/**
 * Register (or re-register) the central message listener that dispatches
 * every `ledger-offscreen` action to the current active handler.
 */
function registerMessageListener(): void {
  if (messageListener) {
    chrome.runtime.onMessage.removeListener(messageListener);
  }

  messageListener = (
    msg: {
      target: string;
      action: LedgerAction;
      params?: Record<string, unknown>;
    },
    _sender: unknown,
    sendResponse: (response: unknown) => void,
  ): boolean => {
    if (msg.target !== OffscreenCommunicationTarget.ledgerOffscreen) {
      return false;
    }

    if (!activeHandler) {
      sendResponse({
        success: false,
        payload: { error: { message: 'No active Ledger handler' } },
      });
      return true;
    }

    activeHandler
      .handleAction(msg.action, msg.params)
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

    return true; // async response
  };

  chrome.runtime.onMessage.addListener(messageListener);
}

/**
 * Create a new handler for the given mode and initialise it.
 *
 * Passes `skipMessageListener = true` so the handler does **not** register
 * its own chrome.runtime.onMessage listener — the central router manages
 * a single listener that dispatches to `handleAction()`.
 * @param mode
 */
async function createHandler(mode: LedgerHandlerMode): Promise<LedgerHandler> {
  if (mode === LedgerHandlerMode.DMK) {
    const handler = new LedgerDMKBridgeHandler();
    await handler.init(true);
    return handler;
  }

  const handler = await initLegacy();
  await handler.init(true);
  return handler;
}

/**
 * Initialises the Ledger offscreen handler for the first time.
 *
 * Registers a central `chrome.runtime.onMessage` listener and creates
 * the appropriate handler (DMK bridge or legacy).
 * @param mode
 */
export default async function initLedger(
  mode: LedgerHandlerMode,
): Promise<void> {
  console.debug(
    '[LedgerOffscreen] Module init() — creating handler',
    JSON.stringify({ mode }),
  );

  // Signal that an init is in-flight so that switchLedgerHandler can
  // await it instead of creating a duplicate Legacy handler.
  const promise = (async () => {
    // Create the new handler first, atomically swap it into activeHandler,
    // then lazily destroy the old handler. This mirrors switchLedgerHandler's
    // pattern and prevents handler leaks when initLedger is called with an
    // existing handler active (Bug 1 guard path, Bug 4 timeout fallback).
    const newHandler = await createHandler(mode);
    const previous = activeHandler;
    activeHandler = newHandler;
    currentMode = mode;
    registerMessageListener();

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
 * (zero gap — no message loss window), then lazily destroys the old
 * handler.  If creation throws, the old handler stays intact.
 *
 * If called before any handler has been initialised (e.g., a
 * `switchLedgerMode` event arrives during bootstrap before `initLedger`
 * has run), Legacy is used as the default starting mode and then the
 * switch proceeds normally.
 *
 * Switching to the same mode is a safe no-op.
 * @param mode
 */
export async function switchLedgerHandler(
  mode: LedgerHandlerMode,
): Promise<void> {
  // If an initLedger call is in-flight, wait for it to complete so we
  // see the correct activeHandler and currentMode. Without this guard,
  // a racing switchLedgerMode event during bootstrap would see
  // activeHandler === null and create a duplicate Legacy handler.
  if (initInProgress) {
    await initInProgress;
  }

  // Bug 1 fix: If no handler has been initialised yet, start with Legacy
  // as the default before switching. This handles the race where
  // switchLedgerMode arrives during bootstrap before initLedger runs.
  if (!activeHandler) {
    console.debug(
      '[LedgerOffscreen] switchLedgerHandler() — no active handler, initialising Legacy as default',
    );
    await initLedger(LedgerHandlerMode.Legacy);
  }

  if (mode === currentMode) {
    return;
  }

  console.debug(
    '[LedgerOffscreen] switchLedgerHandler() — switching mode',
    JSON.stringify({ from: currentMode, to: mode }),
  );

  const newHandler = await createHandler(mode);
  const previous = activeHandler;
  activeHandler = newHandler;
  currentMode = mode;
  registerMessageListener();

  if (previous) {
    await previous.destroy();
  }
}

/**
 * Listen for runtime mode switches driven by the remote feature flag.
 *
 * When the background's subscription detects a change in the `enableDmk`
 * remote flag it sends a `switchLedgerMode` event. This listener picks
 * it up and hot-swaps the active handler without reloading the offscreen.
 */
function listenForModeSwitches(): void {
  chrome.runtime.onMessage.addListener((msg: Record<string, unknown>) => {
    if (
      msg?.target === OffscreenCommunicationTarget.extension &&
      msg?.event === OffscreenCommunicationEvents.switchLedgerMode
    ) {
      console.debug(
        '[LedgerOffscreen] Received switchLedgerMode event',
        JSON.stringify({ mode: msg.mode }),
      );
      switchLedgerHandler(msg.mode as LedgerHandlerMode).catch((error) => {
        console.log(
          '[LedgerOffscreen] Failed to switch Ledger handler:',
          error,
        );
      });
    }
  });
}

/**
 * Bootstrap the Ledger handler in the offscreen document.
 *
 * Registers the mode-switch listener first so we do not miss a
 * `switchLedgerMode` event. Then initialises the Legacy handler
 * immediately as the default. The background will later push the
 * correct mode (DMK or Legacy) once the controller is ready —
 * the mode-switch listener handles that hot-swap.
 */
export async function bootstrapLedger(): Promise<void> {
  listenForModeSwitches();

  try {
    await initLedger(LedgerHandlerMode.Legacy);
  } catch (error) {
    console.log('Ledger initialization failed:', error);
  }
}
