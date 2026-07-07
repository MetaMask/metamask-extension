import {
  LedgerHandlerMode,
  LedgerAction,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';

const mockDmkInit = jest.fn();
const mockDmkDestroy = jest.fn();
const mockDmkHandleAction = jest.fn();

const mockLegacyInit = jest.fn();
const mockLegacyDestroy = jest.fn();
const mockLegacyHandleAction = jest.fn();

type MockHandler = {
  init: jest.Mock;
  destroy: jest.Mock;
  handleAction: jest.Mock;
};

let mockDmkInstance: MockHandler;
let mockLegacyInstance: MockHandler;

jest.mock('./ledger-dmk', () => {
  return {
    LedgerDmkBridgeHandler: jest.fn().mockImplementation(() => {
      mockDmkInstance = {
        init: mockDmkInit,
        destroy: mockDmkDestroy,
        handleAction: mockDmkHandleAction,
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
    };
    return mockLegacyInstance;
  }),
}));

// Router exports + mocked handler constructors are re-fetched per test in
// beforeEach (via jest.isolateModules) so each test starts from a clean
// module registry.
type RouterModule = typeof import('./ledger-router');
type DmkModule = typeof import('./ledger-dmk');
type LegacyModule = typeof import('./ledger');

let initLedger: RouterModule['default'];
let switchLedgerHandler: RouterModule['switchLedgerHandler'];
let bootstrapLedger: RouterModule['bootstrapLedger'];
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
  beforeEach(() => {
    // Re-require the router (and its mocked deps) inside an isolated module
    // registry so each test starts with fresh singleton state
    // (activeHandler, currentMode, messageListener, initInProgress) without
    // any test-only reset hook on the production module.
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const router = require('./ledger-router') as RouterModule;
      initLedger = router.default;
      switchLedgerHandler = router.switchLedgerHandler;
      bootstrapLedger = router.bootstrapLedger;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const dmkModule = require('./ledger-dmk') as DmkModule;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const legacyModule = require('./ledger') as LegacyModule;
      mockedDmkCtor = jest.mocked(
        dmkModule.LedgerDmkBridgeHandler,
      ) as jest.Mock;
      mockedLegacyCtor = jest.mocked(legacyModule.default) as jest.Mock;
    });

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
      expect(mockDmkHandleAction).toHaveBeenCalledWith(
        LedgerAction.getPublicKey,
        { hdPath: "m/44'/60'/0'/0/0" },
      );

      await flushAsync();
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

      expect(mockLegacyHandleAction).toHaveBeenCalledWith(
        LedgerAction.getPublicKey,
        undefined,
      );

      await flushAsync();
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
  });

  describe('bootstrapLedger', () => {
    it('initialises the Legacy handler', async () => {
      await bootstrapLedger();

      expect(mockedLegacyCtor).toHaveBeenCalledTimes(1);
      expect(mockLegacyInit).toHaveBeenCalledWith();
      expect(mockedDmkCtor).not.toHaveBeenCalled();
    });
  });

  describe('initLedger handler lifecycle', () => {
    it('calls destroy() on the previous handler before overwriting with a new one', async () => {
      await initLedger(LedgerHandlerMode.DMK);

      const dmkDestroyBefore = mockDmkDestroy.mock.calls.length;
      const legacyDestroyBefore = mockLegacyDestroy.mock.calls.length;

      await initLedger(LedgerHandlerMode.Legacy);
      expect(mockDmkDestroy.mock.calls).toHaveLength(dmkDestroyBefore + 1);
      expect(mockLegacyDestroy.mock.calls).toHaveLength(legacyDestroyBefore);
    });
  });
});
