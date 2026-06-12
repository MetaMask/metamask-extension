import {
  LedgerHandlerMode,
  LedgerAction,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import { LedgerDMKBridgeHandler, serializeLedgerError } from './ledger-dmk';
import initLegacy from './ledger';

/** Shape of incoming ledger offscreen messages. */
type LedgerMessage = {
  target: string;
  action: LedgerAction;
  params?: Record<string, unknown>;
};

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
      msg: LedgerMessage,
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

function asChromeListener(
  listener: (
    msg: LedgerMessage,
    sender: unknown,
    sendResponse: (response: unknown) => void,
  ) => boolean,
) {
  return (
    message: unknown,
    sender: unknown,
    sendResponse: (response?: unknown) => void,
  ) => listener(message as LedgerMessage, sender, sendResponse);
}

/**
 * Register (or re-register) the central message listener that dispatches
 * every `ledger-offscreen` action to the current active handler.
 */
function registerMessageListener(): void {
  if (messageListener) {
    chrome.runtime.onMessage.removeListener(asChromeListener(messageListener));
  }

  messageListener = (
    msg: LedgerMessage,
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

    return true;
  };

  chrome.runtime.onMessage.addListener(asChromeListener(messageListener));
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

  const handler = initLegacy();
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
  const promise = (async () => {
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
  if (initInProgress) {
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
  registerMessageListener();

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
  } catch {
    // Initialization failed — Ledger will not be available
  }
}
