import {
  LedgerHandlerMode,
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';

const mockDmkInit = jest.fn();
const mockDmkDestroy = jest.fn();
const mockDmkHandleAction = jest.fn();
const mockDmkForceReset = jest.fn();

const mockLegacyInit = jest.fn();
const mockLegacyDestroy = jest.fn();
const mockLegacyHandleAction = jest.fn();
const mockLegacyForceReset = jest.fn();

type MockHandler = {
  init: jest.Mock;
  destroy: jest.Mock;
  handleAction: jest.Mock;
  forceReset: jest.Mock;
};

let mockDmkInstance: MockHandler;
let mockLegacyInstance: MockHandler;

jest.mock('./ledger-dmk-handler.ts', () => {
  return {
    LedgerDmkBridgeHandler: jest.fn().mockImplementation(() => {
      mockDmkInstance = {
        init: mockDmkInit,
        destroy: mockDmkDestroy,
        handleAction: mockDmkHandleAction,
        forceReset: mockDmkForceReset,
      };
      return mockDmkInstance;
    }),
  };
});

jest.mock('./ledger-utils', () => ({
  serializeLedgerError: jest.fn((error: unknown) =>
    error instanceof Error
      ? { message: error.message, name: error.name }
      : { message: String(error) },
  ),
}));

jest.mock('./ledger', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    mockLegacyInstance = {
      init: mockLegacyInit,
      destroy: mockLegacyDestroy,
      handleAction: mockLegacyHandleAction,
      forceReset: mockLegacyForceReset,
    };
    return mockLegacyInstance;
  }),
}));

// Router exports + mocked handler constructors are re-fetched per test in
// beforeEach (via jest.isolateModules) so each test starts from a clean
// module registry.
type RouterModule = typeof import('./ledger-router');
type DmkModule = typeof import('./ledger-dmk-handler.ts');
type LegacyModule = typeof import('./ledger');

let initLedger: RouterModule['default'];
let switchLedgerHandler: RouterModule['switchLedgerHandler'];
let bootstrapLedger: RouterModule['bootstrapLedger'];
let READ_ACTION_TIMEOUT_MS: RouterModule['READ_ACTION_TIMEOUT_MS'];
let SIGN_ACTION_TIMEOUT_MS: RouterModule['SIGN_ACTION_TIMEOUT_MS'];
let mockedDmkCtor: jest.Mock;
let mockedLegacyCtor: jest.Mock;

type MessageListener = (
  msg: Record<string, unknown>,
  sender: Record<string, unknown>,
  sendResponse: (response: unknown) => void,
) => boolean;

let capturedListener: MessageListener | null = null;
const capturedListeners: Set<MessageListener> = new Set();
const mockAddListener = jest.fn((callback: MessageListener) => {
  capturedListener = callback;
  capturedListeners.add(callback);
});
const mockRemoveListener = jest.fn((callback: MessageListener) => {
  capturedListeners.delete(callback);
  if (capturedListener === callback) {
    capturedListener = null;
  }
});

const mockSendMessage = jest.fn();

Object.defineProperty(globalThis, 'chrome', {
  value: {
    runtime: {
      onMessage: {
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
      },
      sendMessage: mockSendMessage,
    },
  },
  writable: true,
  configurable: true,
});

// ---- Helpers ----

function getListener(): MessageListener {
  if (!capturedListener) {
    throw new Error('No listener captured');
  }
  return capturedListener;
}

function makeMessage(
  action: LedgerAction,
  params?: Record<string, unknown>,
  target = OffscreenCommunicationTarget.ledgerOffscreen,
) {
  return { target, action, params };
}

function flushAsync() {
  return new Promise((r) => setTimeout(r, 0));
}

describe('LedgerRouter', () => {
  beforeEach(async () => {
    // Re-require the router inside an isolated module registry so each test
    // starts with fresh singleton state (activeHandler, currentMode, etc.)
    // without any test-only reset hook on the production module.
    //
    // Dynamic `import('./ledger-dmk-handler.ts')` inside createHandler resolves
    // against the global Jest registry (isolation only applies during this
    // callback), so handler mocks are read from the global registry below —
    // not from inside the isolated block.
    await jest.isolateModulesAsync(async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const router = require('./ledger-router') as RouterModule;
      initLedger = router.default;
      switchLedgerHandler = router.switchLedgerHandler;
      bootstrapLedger = router.bootstrapLedger;
      READ_ACTION_TIMEOUT_MS = router.READ_ACTION_TIMEOUT_MS;
      SIGN_ACTION_TIMEOUT_MS = router.SIGN_ACTION_TIMEOUT_MS;
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports, import-x/extensions
    const dmkModule = require('./ledger-dmk-handler.ts') as DmkModule;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const legacyModule = require('./ledger') as LegacyModule;
    mockedDmkCtor = jest.mocked(dmkModule.LedgerDmkBridgeHandler) as jest.Mock;
    mockedLegacyCtor = jest.mocked(legacyModule.default) as jest.Mock;

    jest.clearAllMocks();
    capturedListener = null;
    capturedListeners.clear();
    mockLegacyInit.mockResolvedValue(undefined);
    mockLegacyDestroy.mockResolvedValue(undefined);
    mockDmkInit.mockResolvedValue(undefined);
    mockDmkDestroy.mockResolvedValue(undefined);
  });

  describe('initLedger', () => {
    it('initialises the DMK handler when mode is DMK', async () => {
      await initLedger(LedgerHandlerMode.DMK);

      expect(mockedDmkCtor).toHaveBeenCalledTimes(1);
      expect(mockDmkInit).toHaveBeenCalledTimes(1);
      expect(mockDmkInit).toHaveBeenCalledWith();
      expect(mockedLegacyCtor).not.toHaveBeenCalled();
    });

    it('initialises the Legacy handler when mode is Legacy', async () => {
      await initLedger(LedgerHandlerMode.Legacy);

      expect(mockedDmkCtor).not.toHaveBeenCalled();
      expect(mockedLegacyCtor).toHaveBeenCalledTimes(1);
    });

    it('registers a message listener for LedgerOffscreen target', async () => {
      await initLedger(LedgerHandlerMode.DMK);

      expect(mockAddListener).toHaveBeenCalledTimes(1);
      expect(capturedListener).not.toBeNull();
    });

    it('does NOT re-register the listener on subsequent init calls (idempotent)', async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      const firstListener = capturedListener;
      expect(mockAddListener).toHaveBeenCalledTimes(1);
      expect(capturedListeners.size).toBe(1);

      await initLedger(LedgerHandlerMode.DMK);

      // The listener closes over module-level `activeHandler`, so it does not
      // need to be removed + re-registered when the handler is swapped.
      expect(mockRemoveListener).not.toHaveBeenCalled();
      expect(mockAddListener).toHaveBeenCalledTimes(1);
      expect(capturedListeners.size).toBe(1);
      expect(capturedListener).toBe(firstListener);
    });

    it('does NOT call init() on the Legacy handler itself (router owns init)', async () => {
      await initLedger(LedgerHandlerMode.Legacy);

      expect(mockedLegacyCtor).toHaveBeenCalledTimes(1);
      expect(mockLegacyInit).toHaveBeenCalledTimes(1);
      expect(mockLegacyInit).toHaveBeenCalledWith();
    });
  });

  describe('message routing', () => {
    it('routes LedgerOffscreen messages to the DMK handler', async () => {
      await initLedger(LedgerHandlerMode.DMK);
      mockDmkHandleAction.mockResolvedValue('dmk-result');

      const sendResponse = jest.fn();

      const result = getListener()(
        makeMessage(LedgerAction.getPublicKey, {
          hdPath: "m/44'/60'/0'/0/0",
        }),
        {},
        sendResponse,
      );

      expect(result).toBe(true);

      await flushAsync();
      expect(mockDmkHandleAction).toHaveBeenCalledWith(
        LedgerAction.getPublicKey,
        { hdPath: "m/44'/60'/0'/0/0" },
      );
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        payload: 'dmk-result',
      });
    });

    it('routes LedgerOffscreen messages to the Legacy handler', async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      mockLegacyHandleAction.mockResolvedValue('legacy-result');

      const sendResponse = jest.fn();

      getListener()(makeMessage(LedgerAction.getPublicKey), {}, sendResponse);

      await flushAsync();
      expect(mockLegacyHandleAction).toHaveBeenCalledWith(
        LedgerAction.getPublicKey,
        undefined,
      );
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        payload: 'legacy-result',
      });
    });

    it('ignores messages not targeting LedgerOffscreen', async () => {
      await initLedger(LedgerHandlerMode.DMK);

      const result = getListener()(
        // @ts-expect-error - invalid target
        makeMessage(LedgerAction.getPublicKey, undefined, 'other-target'),
        {},
        jest.fn(),
      );

      expect(result).toBe(false);
      expect(mockDmkHandleAction).not.toHaveBeenCalled();
    });

    it('calls sendResponse with error payload on handler failure', async () => {
      await initLedger(LedgerHandlerMode.DMK);
      mockDmkHandleAction.mockRejectedValue(new Error('bad'));

      const sendResponse = jest.fn();

      getListener()(makeMessage(LedgerAction.getPublicKey), {}, sendResponse);

      await flushAsync();
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        payload: { error: expect.objectContaining({ message: 'bad' }) },
      });
    });

    it('serializes concurrent actions so the second runs only after the first resolves', async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      let resolveFirst!: (value: unknown) => void;
      const firstPending = new Promise((r) => {
        resolveFirst = r;
      });
      mockLegacyHandleAction.mockReturnValueOnce(firstPending);
      mockLegacyHandleAction.mockResolvedValueOnce('second-result');

      const sendResponse1 = jest.fn();
      const sendResponse2 = jest.fn();

      getListener()(
        makeMessage(LedgerAction.getPublicKey, { hdPath: 'a' }),
        {},
        sendResponse1,
      );
      getListener()(
        makeMessage(LedgerAction.getPublicKey, { hdPath: 'b' }),
        {},
        sendResponse2,
      );

      await flushAsync();
      // First action is in flight; the second must not have started yet, and
      // neither response has been sent.
      expect(mockLegacyHandleAction).toHaveBeenCalledTimes(1);
      expect(sendResponse1).not.toHaveBeenCalled();
      expect(sendResponse2).not.toHaveBeenCalled();

      resolveFirst('first-result');
      await flushAsync();

      expect(mockLegacyHandleAction).toHaveBeenCalledTimes(2);
      expect(sendResponse1).toHaveBeenCalledWith({
        success: true,
        payload: 'first-result',
      });
      expect(sendResponse2).toHaveBeenCalledWith({
        success: true,
        payload: 'second-result',
      });
    });

    it('rejects a wedged action after the timeout, force-resets the handler, and frees the chain', async () => {
      const sendResponse1 = jest.fn();
      const sendResponse2 = jest.fn();
      jest.useFakeTimers();
      try {
        await initLedger(LedgerHandlerMode.Legacy);

        // First action never resolves (wedged offscreen WebHID round-trip);
        // second action resolves normally once it gets to run.
        mockLegacyHandleAction
          .mockReturnValueOnce(
            new Promise(() => {
              /* never resolves */
            }),
          )
          .mockResolvedValueOnce('after-recovery');

        getListener()(
          makeMessage(LedgerAction.getPublicKey, { hdPath: 'a' }),
          {},
          sendResponse1,
        );
        getListener()(
          makeMessage(LedgerAction.getPublicKey, { hdPath: 'b' }),
          {},
          sendResponse2,
        );

        // Let the chain reach the wedged action.
        await Promise.resolve();
        expect(sendResponse1).not.toHaveBeenCalled();

        // Cross the read-action backstop: the link rejects and the
        // handler is force-reset (synchronously, within the timer callback).
        jest.advanceTimersByTime(READ_ACTION_TIMEOUT_MS);
        expect(mockLegacyForceReset).toHaveBeenCalledTimes(1);
      } finally {
        // Always restore real timers so later tests don't hang on faked setTimeout.
        jest.useRealTimers();
      }

      // Drain the microtask chain now that timers are real.
      await flushAsync();
      expect(sendResponse1).toHaveBeenCalledWith({
        success: false,
        payload: {
          error: expect.objectContaining({
            message: expect.stringContaining('timed out'),
          }),
        },
      });
      expect(sendResponse2).toHaveBeenCalledWith({
        success: true,
        payload: 'after-recovery',
      });
    });

    it('swallows the late rejection of a timed-out action (no unhandled rejection)', async () => {
      // After the timeout fires and forceReset closes the transport, the
      // abandoned handleAction promise typically rejects. That rejection must
      // be consumed (not surface as unhandled) and must not change the
      // already-sent timeout response.
      const unhandled: unknown[] = [];
      const onUnhandled = (reason: unknown) => {
        unhandled.push(reason);
      };
      process.on('unhandledRejection', onUnhandled);

      let rejectAction!: (error: unknown) => void;
      const sendResponse = jest.fn();
      jest.useFakeTimers();
      try {
        await initLedger(LedgerHandlerMode.Legacy);
        mockLegacyHandleAction.mockReturnValueOnce(
          new Promise<unknown>((_resolve, reject) => {
            rejectAction = reject;
          }),
        );

        getListener()(
          makeMessage(LedgerAction.getPublicKey, { hdPath: 'a' }),
          {},
          sendResponse,
        );

        // Let the chain reach the wedged action, then cross the read-action
        // backstop. forceReset runs synchronously inside the timer.
        await Promise.resolve();
        jest.advanceTimersByTime(READ_ACTION_TIMEOUT_MS);
        expect(mockLegacyForceReset).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }

      // Drain the microtask chain: the timeout rejection reaches sendResponse.
      await flushAsync();
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        payload: {
          error: expect.objectContaining({
            message: expect.stringContaining('timed out'),
          }),
        },
      });

      // The transport now closes (forceReset ran); the wedged action rejects
      // late. This rejection must be consumed, not surface as unhandled.
      rejectAction(new Error('transport closed'));
      await flushAsync();
      process.off('unhandledRejection', onUnhandled);

      expect(unhandled).toHaveLength(0);
      // The timeout response stands; the late rejection did not overwrite it.
      expect(sendResponse).toHaveBeenCalledTimes(1);
    });

    it('uses the longer sign-action backstop for signing actions (330s, not 60s)', async () => {
      // Signing actions (signTransaction/signPersonalMessage/signTypedData)
      // require user confirmation on the device and use a longer backstop than
      // read actions. A wedged sign action must NOT time out at the 60s read
      // backstop — only at the 330s sign backstop.
      jest.useFakeTimers();
      const sendResponse = jest.fn();
      try {
        await initLedger(LedgerHandlerMode.Legacy);
        mockLegacyHandleAction.mockReturnValueOnce(
          new Promise(() => {
            /* never resolves */
          }),
        );

        getListener()(
          makeMessage(LedgerAction.signTransaction, {
            hdPath: 'a',
            tx: '0x0',
          }),
          {},
          sendResponse,
        );

        // Let the chain reach the wedged action.
        await Promise.resolve();

        // Cross the read-action backstop: a signing action is still pending.
        jest.advanceTimersByTime(READ_ACTION_TIMEOUT_MS);
        expect(mockLegacyForceReset).not.toHaveBeenCalled();
        expect(sendResponse).not.toHaveBeenCalled();

        // Cross the remaining sign-action backstop: now it times
        // out and force-resets the handler.
        jest.advanceTimersByTime(
          SIGN_ACTION_TIMEOUT_MS - READ_ACTION_TIMEOUT_MS,
        );
        expect(mockLegacyForceReset).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }

      await flushAsync();
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        payload: {
          error: expect.objectContaining({
            message: expect.stringContaining('timed out'),
          }),
        },
      });
    });
  });

  describe('switchLedgerHandler', () => {
    it('switches from Legacy to DMK', async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      expect(mockLegacyInit).toHaveBeenCalledTimes(1);
      jest.clearAllMocks();

      await switchLedgerHandler(LedgerHandlerMode.DMK);

      expect(mockLegacyDestroy).toHaveBeenCalledTimes(1);
      expect(mockedDmkCtor).toHaveBeenCalledTimes(1);
      expect(mockDmkInit).toHaveBeenCalledTimes(1);
    });

    it('switches from DMK to Legacy', async () => {
      await initLedger(LedgerHandlerMode.DMK);
      jest.clearAllMocks();

      await switchLedgerHandler(LedgerHandlerMode.Legacy);

      expect(mockDmkDestroy).toHaveBeenCalledTimes(1);
      expect(mockedLegacyCtor).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when switching to the same mode', async () => {
      await initLedger(LedgerHandlerMode.DMK);
      jest.clearAllMocks();

      await switchLedgerHandler(LedgerHandlerMode.DMK);

      expect(mockDmkDestroy).not.toHaveBeenCalled();
      expect(mockedDmkCtor).not.toHaveBeenCalled();
    });

    it('routes incoming messages to the new handler after a switch (same listener)', async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      mockLegacyHandleAction.mockResolvedValue('old');

      const sendResponse = jest.fn();
      getListener()(makeMessage(LedgerAction.getPublicKey), {}, sendResponse);
      await flushAsync();
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        payload: 'old',
      });

      jest.clearAllMocks();
      mockDmkHandleAction.mockResolvedValue('new');

      await switchLedgerHandler(LedgerHandlerMode.DMK);

      const sendResponse2 = jest.fn();
      getListener()(makeMessage(LedgerAction.getPublicKey), {}, sendResponse2);
      await flushAsync();
      expect(sendResponse2).toHaveBeenCalledWith({
        success: true,
        payload: 'new',
      });
    });

    it('keeps the old handler alive when createHandler throws', async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      mockLegacyHandleAction.mockResolvedValue('legacy-result');
      jest.clearAllMocks();

      mockDmkInit.mockRejectedValueOnce(new Error('dmk-failed'));

      await expect(switchLedgerHandler(LedgerHandlerMode.DMK)).rejects.toThrow(
        'dmk-failed',
      );

      expect(mockLegacyDestroy).not.toHaveBeenCalled();

      const sendResponse = jest.fn();
      getListener()(makeMessage(LedgerAction.getPublicKey), {}, sendResponse);
      await flushAsync();
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        payload: 'legacy-result',
      });
    });

    it('awaits an in-flight initLedger before switching, avoiding a duplicate handler', async () => {
      // Start a Legacy init and hold it in flight so a switch arriving
      // mid-init must wait for `initInProgress` to settle before creating the
      // new (DMK) handler. Without the guard, the switch would see
      // `activeHandler === null` and boot a second Legacy handler.
      let resolveLegacyInit!: () => void;
      mockLegacyInit.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveLegacyInit = resolve;
        }),
      );

      const initPromise = initLedger(LedgerHandlerMode.Legacy);
      // initLedger assigns `initInProgress` synchronously before suspending.
      const switchPromise = switchLedgerHandler(LedgerHandlerMode.DMK);

      // The switch is parked on the in-flight init; no DMK handler is created yet.
      await Promise.resolve();
      expect(mockedDmkCtor).not.toHaveBeenCalled();

      // Let the initial init complete; the switch can now proceed.
      resolveLegacyInit();
      await Promise.all([initPromise, switchPromise]);

      // Exactly one Legacy handler (from initLedger) and one DMK handler (from
      // the switch); the Legacy handler was destroyed after the atomic swap.
      expect(mockedLegacyCtor).toHaveBeenCalledTimes(1);
      expect(mockedDmkCtor).toHaveBeenCalledTimes(1);
      expect(mockLegacyDestroy).toHaveBeenCalledTimes(1);
    });

    it('does not block later switches when previous.destroy() hangs', async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      jest.clearAllMocks();

      // Simulate a wedged WebHID close: destroy never settles.
      mockLegacyDestroy.mockReturnValueOnce(new Promise(() => undefined));

      await expect(
        switchLedgerHandler(LedgerHandlerMode.DMK),
      ).resolves.toBeUndefined();
      expect(mockLegacyDestroy).toHaveBeenCalledTimes(1);

      // A subsequent switch must still run; awaiting hung destroy would
      // permanently stick switchInProgress.
      await expect(
        switchLedgerHandler(LedgerHandlerMode.Legacy),
      ).resolves.toBeUndefined();
      expect(mockedLegacyCtor).toHaveBeenCalledTimes(1);
      expect(mockDmkDestroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('bootstrapLedger', () => {
    it('initialises the Legacy handler', async () => {
      await bootstrapLedger();

      expect(mockedLegacyCtor).toHaveBeenCalledTimes(1);
      expect(mockLegacyInit).toHaveBeenCalledWith();
      expect(mockedDmkCtor).not.toHaveBeenCalled();
    });

    it('notifies the background after the mode listener is ready', async () => {
      await bootstrapLedger();

      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extensionMain,
        event: OffscreenCommunicationEvents.ledgerModeReady,
      });
    });

    it('registers a listener that switches modes on switchLedgerMode events', async () => {
      await bootstrapLedger();
      jest.clearAllMocks();
      mockDmkInit.mockResolvedValue(undefined);

      for (const listener of capturedListeners) {
        listener(
          {
            target: OffscreenCommunicationTarget.extension,
            event: OffscreenCommunicationEvents.switchLedgerMode,
            mode: LedgerHandlerMode.DMK,
          },
          {},
          jest.fn(),
        );
      }

      await flushAsync();
      await flushAsync();

      expect(mockedDmkCtor).toHaveBeenCalledTimes(1);
      expect(mockDmkInit).toHaveBeenCalledWith();
    });

    it('ignores switchLedgerMode events with an invalid mode', async () => {
      await bootstrapLedger();
      jest.clearAllMocks();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      for (const listener of capturedListeners) {
        listener(
          {
            target: OffscreenCommunicationTarget.extension,
            event: OffscreenCommunicationEvents.switchLedgerMode,
            mode: 'not-a-mode',
          },
          {},
          jest.fn(),
        );
      }

      await flushAsync();

      expect(mockedDmkCtor).not.toHaveBeenCalled();
      expect(mockedLegacyCtor).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ledger-router] ignore switchLedgerMode with invalid mode:',
        'not-a-mode',
      );

      consoleErrorSpy.mockRestore();
    });

    it('is a no-op when switchLedgerMode requests the already-active mode', async () => {
      await bootstrapLedger();
      jest.clearAllMocks();

      for (const listener of capturedListeners) {
        listener(
          {
            target: OffscreenCommunicationTarget.extension,
            event: OffscreenCommunicationEvents.switchLedgerMode,
            mode: LedgerHandlerMode.Legacy,
          },
          {},
          jest.fn(),
        );
      }

      await flushAsync();
      await flushAsync();

      expect(mockedDmkCtor).not.toHaveBeenCalled();
      expect(mockedLegacyCtor).not.toHaveBeenCalled();
      expect(mockLegacyDestroy).not.toHaveBeenCalled();
    });

    it('swallows init failure and logs instead of throwing', async () => {
      // A real device failure during bootstrap must not reject the bootstrap
      // promise (the offscreen document would otherwise be left in a broken
      // state); it is logged so the failure is observable from DevTools.
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockLegacyInit.mockRejectedValueOnce(new Error('init boom'));

      await expect(bootstrapLedger()).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ledger-router] bootstrapLedger failed:',
        expect.objectContaining({ message: 'init boom' }),
      );
      // Ready notification still fires so background can retry.
      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extensionMain,
        event: OffscreenCommunicationEvents.ledgerModeReady,
      });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('initLedger handler lifecycle', () => {
    it('retires the previous handler without awaiting hung destroy', async () => {
      await initLedger(LedgerHandlerMode.DMK);
      jest.clearAllMocks();

      mockDmkDestroy.mockReturnValueOnce(new Promise(() => undefined));

      await expect(
        initLedger(LedgerHandlerMode.Legacy),
      ).resolves.toBeUndefined();
      expect(mockDmkDestroy).toHaveBeenCalledTimes(1);
      expect(mockedLegacyCtor).toHaveBeenCalledTimes(1);
    });
  });
});
