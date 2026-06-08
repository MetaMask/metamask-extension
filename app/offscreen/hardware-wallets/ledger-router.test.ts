import {
  LedgerHandlerMode,
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from "../../../shared/constants/offscreen-communication";

// ---- Mocks ----

const mockDmkInit = jest.fn();
const mockDmkDestroy = jest.fn();
const mockDmkHandleAction = jest.fn();

const mockLegacyInit = jest.fn();
const mockLegacyDestroy = jest.fn();
const mockLegacyHandleAction = jest.fn();

let mockDmkInstance: { init: jest.Mock; destroy: jest.Mock; handleAction: jest.Mock };
let mockLegacyInstance: { init: jest.Mock; destroy: jest.Mock; handleAction: jest.Mock };

jest.mock("./ledger-dmk", () => ({
  LedgerDMKBridgeHandler: jest.fn().mockImplementation(() => {
    mockDmkInstance = {
      init: mockDmkInit,
      destroy: mockDmkDestroy,
      handleAction: mockDmkHandleAction,
    };
    return mockDmkInstance;
  }),
}));

jest.mock("./ledger", () => ({
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

// ---- Chrome Runtime Mock ----

let capturedListener: ((msg: any, sender: any, sendResponse: any) => boolean) | null = null;
const capturedListeners: Set<(msg: any, sender: any, sendResponse: any) => boolean> = new Set();
const mockAddListener = jest.fn((callback) => {
  capturedListener = callback;
  capturedListeners.add(callback);
});
const mockRemoveListener = jest.fn((callback) => {
  capturedListeners.delete(callback);
  if (capturedListener === callback) {
    capturedListener = null;
  }
});

const mockSendMessage = jest.fn();

Object.defineProperty(globalThis, "chrome", {
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

// We use a dynamic import so mocks take effect before the module loads
let initLedger: (mode: LedgerHandlerMode) => Promise<void>;
let switchLedgerHandler: (mode: LedgerHandlerMode) => Promise<void>;
let bootstrapLedger: () => Promise<void>;

beforeAll(async () => {
  const mod = await import("./ledger-router");
  initLedger = mod.default;
  // Cast: the module exports initLedger as default; switchLedgerHandler is a named export
  switchLedgerHandler = (mod as any).switchLedgerHandler;
  bootstrapLedger = (mod as any).bootstrapLedger;
});

// ---- Tests ----

describe("LedgerRouter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedListener = null;
    capturedListeners.clear();
    mockDmkHandleAction.mockReset();
    mockLegacyHandleAction.mockReset();
    // Ensure the Legacy handler mocks have a default resolved implementation.
    // The factory no longer calls .mockResolvedValue() itself so that tests
    // can override with .mockImplementation() without being overwritten.
    mockLegacyInit.mockResolvedValue(undefined);
    mockLegacyDestroy.mockResolvedValue(undefined);
    mockDmkInit.mockResolvedValue(undefined);
    mockDmkDestroy.mockResolvedValue(undefined);
  });

  // --- initLedger(mode) ---

  describe("initLedger", () => {
    it("initialises the DMK handler when mode is DMK", async () => {
      await initLedger(LedgerHandlerMode.DMK);

      const { LedgerDMKBridgeHandler } = await import("./ledger-dmk");
      const { default: initLegacyFn } = await import("./ledger");

      expect(LedgerDMKBridgeHandler).toHaveBeenCalledTimes(1);
      expect(mockDmkInit).toHaveBeenCalledTimes(1);
      expect(initLegacyFn).not.toHaveBeenCalled();
    });

    it("initialises the Legacy handler when mode is Legacy", async () => {
      await initLedger(LedgerHandlerMode.Legacy);

      const { LedgerDMKBridgeHandler } = await import("./ledger-dmk");
      const { default: initLegacyFn } = await import("./ledger");

      expect(LedgerDMKBridgeHandler).not.toHaveBeenCalled();
      expect(initLegacyFn).toHaveBeenCalledTimes(1);
    });

    it("registers a message listener for LedgerOffscreen target", async () => {
      await initLedger(LedgerHandlerMode.DMK);

      expect(mockAddListener).toHaveBeenCalledTimes(1);
      expect(capturedListener).not.toBeNull();
    });

    it("does NOT call init() on the Legacy handler itself (router owns init)", async () => {
      // initLegacy() now just constructs the handler — it does not call
      // handler.init().  The router's createHandler() calls init(true) to
      // skip the handler's own message listener while still setting up
      // device event listeners.  This prevents double-dispatch of messages.
      await initLedger(LedgerHandlerMode.Legacy);

      const { default: initLegacyFn } = await import("./ledger");

      // initLegacy() was called (creates instance) but not init()
      expect(initLegacyFn).toHaveBeenCalledTimes(1);
      // The router's createHandler calls handler.init(true) exactly once
      expect(mockLegacyInit).toHaveBeenCalledTimes(1);
      expect(mockLegacyInit).toHaveBeenCalledWith(true);
    });
  });

  // --- message routing ---

  describe("message routing", () => {
    it("routes LedgerOffscreen messages to the DMK handler", async () => {
      await initLedger(LedgerHandlerMode.DMK);
      mockDmkHandleAction.mockResolvedValue("dmk-result");

      const sendResponse = jest.fn();

      const result = capturedListener!(
        {
          target: OffscreenCommunicationTarget.ledgerOffscreen,
          action: LedgerAction.getPublicKey,
          params: { hdPath: "m/44'/60'/0'/0/0" },
        },
        {},
        sendResponse,
      );

      // Listener returns true for async response
      expect(result).toBe(true);
      expect(mockDmkHandleAction).toHaveBeenCalledWith(LedgerAction.getPublicKey, {
        hdPath: "m/44'/60'/0'/0/0",
      });

      // Wait for async response
      await new Promise((r) => setTimeout(r, 0));
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        payload: "dmk-result",
      });
    });

    it("routes LedgerOffscreen messages to the Legacy handler", async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      mockLegacyHandleAction.mockResolvedValue("legacy-result");

      const sendResponse = jest.fn();

      capturedListener!(
        {
          target: OffscreenCommunicationTarget.ledgerOffscreen,
          action: LedgerAction.getPublicKey,
        },
        {},
        sendResponse,
      );

      expect(mockLegacyHandleAction).toHaveBeenCalledWith(LedgerAction.getPublicKey, undefined);

      await new Promise((r) => setTimeout(r, 0));
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        payload: "legacy-result",
      });
    });

    it("ignores messages not targeting LedgerOffscreen", async () => {
      await initLedger(LedgerHandlerMode.DMK);

      const result = capturedListener!(
        { target: "other-target", action: "something" },
        {},
        jest.fn(),
      );

      expect(result).toBe(false);
      expect(mockDmkHandleAction).not.toHaveBeenCalled();
    });

    it("calls sendResponse with error payload on handler failure", async () => {
      await initLedger(LedgerHandlerMode.DMK);
      mockDmkHandleAction.mockRejectedValue(new Error("bad"));

      const sendResponse = jest.fn();

      capturedListener!(
        {
          target: OffscreenCommunicationTarget.ledgerOffscreen,
          action: LedgerAction.getPublicKey,
        },
        {},
        sendResponse,
      );

      await new Promise((r) => setTimeout(r, 0));
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        payload: { error: expect.objectContaining({ message: "bad" }) },
      });
    });
  });

  // --- switchLedgerHandler(mode) ---

  describe("switchLedgerHandler", () => {
    it("switches from Legacy to DMK", async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      expect(mockLegacyInit).toHaveBeenCalledTimes(1);
      const { default: initLegacyFn } = await import("./ledger");

      initLegacyFn.mockClear();
      mockLegacyDestroy.mockClear();
      jest.clearAllMocks();

      // Re-import mocks that got cleared
      const { LedgerDMKBridgeHandler } = await import("./ledger-dmk");

      await switchLedgerHandler(LedgerHandlerMode.DMK);

      // Old handler should be destroyed
      expect(mockLegacyDestroy).toHaveBeenCalledTimes(1);

      // New handler should be created
      expect(LedgerDMKBridgeHandler).toHaveBeenCalledTimes(1);
      expect(mockDmkInit).toHaveBeenCalledTimes(1);
    });

    it("switches from DMK to Legacy", async () => {
      await initLedger(LedgerHandlerMode.DMK);
      jest.clearAllMocks();

      const { default: initLegacyFn } = await import("./ledger");

      await switchLedgerHandler(LedgerHandlerMode.Legacy);

      expect(mockDmkDestroy).toHaveBeenCalledTimes(1);
      expect(initLegacyFn).toHaveBeenCalledTimes(1);
    });

    it("is a no-op when switching to the same mode", async () => {
      await initLedger(LedgerHandlerMode.DMK);
      jest.clearAllMocks();

      await switchLedgerHandler(LedgerHandlerMode.DMK);

      expect(mockDmkDestroy).not.toHaveBeenCalled();
      const { LedgerDMKBridgeHandler } = await import("./ledger-dmk");
      expect(LedgerDMKBridgeHandler).not.toHaveBeenCalled();
    });

    it("replaces the message listener after switching", async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      mockLegacyHandleAction.mockResolvedValue("old");

      // Verify legacy routing works
      const sendResponse = jest.fn();
      capturedListener!(
        { target: OffscreenCommunicationTarget.ledgerOffscreen, action: LedgerAction.getPublicKey },
        {},
        sendResponse,
      );
      await new Promise((r) => setTimeout(r, 0));
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        payload: "old",
      });

      // Switch to DMK
      jest.clearAllMocks();
      mockDmkHandleAction.mockResolvedValue("new");

      await switchLedgerHandler(LedgerHandlerMode.DMK);

      // The listener should now route to DMK
      const sendResponse2 = jest.fn();
      capturedListener!(
        { target: OffscreenCommunicationTarget.ledgerOffscreen, action: LedgerAction.getPublicKey },
        {},
        sendResponse2,
      );
      await new Promise((r) => setTimeout(r, 0));
      expect(sendResponse2).toHaveBeenCalledWith({
        success: true,
        payload: "new",
      });
    });

    it("keeps the old handler alive when createHandler throws", async () => {
      await initLedger(LedgerHandlerMode.Legacy);
      mockLegacyHandleAction.mockResolvedValue("legacy-result");
      jest.clearAllMocks();

      // Force createHandler for DMK to throw
      mockDmkInit.mockRejectedValueOnce(new Error("dmk-failed"));

      await expect(switchLedgerHandler(LedgerHandlerMode.DMK)).rejects.toThrow("dmk-failed");

      // The old handler should NOT have been destroyed
      expect(mockLegacyDestroy).not.toHaveBeenCalled();

      // The old handler should still be active and routing messages
      const sendResponse = jest.fn();
      capturedListener!(
        {
          target: OffscreenCommunicationTarget.ledgerOffscreen,
          action: LedgerAction.getPublicKey,
        },
        {},
        sendResponse,
      );
      await new Promise((r) => setTimeout(r, 0));
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        payload: "legacy-result",
      });
    });
  });

  // --- bootstrapLedger() ---

  describe("bootstrapLedger", () => {
    it("initialises the Legacy handler", async () => {
      await bootstrapLedger();

      const { default: initLegacyFn } = await import("./ledger");
      const { LedgerDMKBridgeHandler } = await import("./ledger-dmk");

      expect(initLegacyFn).toHaveBeenCalledTimes(1);
      expect(mockLegacyInit).toHaveBeenCalledWith(true);
      expect(LedgerDMKBridgeHandler).not.toHaveBeenCalled();
    });

    it("registers a switchLedgerMode listener before initialisation completes", async () => {
      await bootstrapLedger();

      // After bootstrap completes, sending a switchLedgerMode(DMK) event
      // should hot-swap the handler from Legacy to DMK.
      const { default: initLegacyFn } = await import("./ledger");
      initLegacyFn.mockClear();
      mockLegacyDestroy.mockClear();

      const switchEvent = {
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.DMK,
      };

      for (const listener of capturedListeners) {
        try {
          (listener as any)(switchEvent, {}, jest.fn());
        } catch {
          // Some listeners may throw if they don't handle this message shape.
        }
      }

      await new Promise((r) => setTimeout(r, 10));

      // Legacy handler should have been destroyed by the switch.
      expect(mockLegacyDestroy).toHaveBeenCalledTimes(1);
    });

    it("switchLedgerMode arriving during bootstrap triggers switch (Bug 1)", async () => {
      // Bug 1: switchLedgerMode event arrives while bootstrap is
      // running initLedger(Legacy). switchLedgerHandler is called
      // with no activeHandler yet — Bug 1 guard initialises Legacy
      // as default, then proceeds with the switch to DMK.
      const bootstrapPromise = bootstrapLedger();
      // Allow listenForModeSwitches to register and initLedger to start.
      await new Promise((r) => setTimeout(r, 0));

      const { LedgerDMKBridgeHandler } = await import("./ledger-dmk");
      const initialDmkCalls = LedgerDMKBridgeHandler.mock.calls.length;

      const switchEvent = {
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.DMK,
      };

      for (const listener of capturedListeners) {
        try {
          (listener as any)(switchEvent, {}, jest.fn());
        } catch {
          // Some listeners may throw
        }
      }

      await new Promise((r) => setTimeout(r, 10));

      // DMK handler was created by the switch.
      expect(LedgerDMKBridgeHandler.mock.calls.length).toBeGreaterThan(initialDmkCalls);

      await bootstrapPromise;
    });

    it("does NOT create Legacy handler twice when switchLedgerMode races with bootstrap", async () => {
      // Race condition: bootstrapLedger() calls initLedger(Legacy).
      // While initLedger is awaiting createHandler(), a switchLedgerMode(DMK)
      // event arrives.  Without a guard, switchLedgerHandler sees no
      // activeHandler and calls initLedger(Legacy) AGAIN — creating a
      // duplicate Legacy handler.  With the fix, switchLedgerHandler waits
      // for the in-progress initLedger to finish, then switches to DMK.
      const { default: initLegacyFn } = await import("./ledger");
      const { LedgerDMKBridgeHandler } = await import("./ledger-dmk");

      // Snapshot current call counts before the test.
      const legacyCreatesBefore = initLegacyFn.mock.calls.length;
      const dmkCreatesBefore = LedgerDMKBridgeHandler.mock.calls.length;

      // Defer handler.init(true) so createHandler stays in-flight.
      // This keeps activeHandler null while the switch event arrives.
      // Collect all resolvers so we can unblock every pending init.
      const initResolvers: (() => void)[] = [];
      mockLegacyInit.mockImplementation(() => {
        return new Promise<void>((resolve) => {
          initResolvers.push(resolve);
        });
      });

      // Start bootstrap — initLedger(Legacy) blocks inside createHandler
      // at await handler.init(true).
      const bootstrapPromise = bootstrapLedger();
      await new Promise((r) => setTimeout(r, 0));

      // activeHandler is still null because createHandler hasn't resolved.

      // Send switchLedgerMode(DMK) — the racing event.
      const switchEvent = {
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.switchLedgerMode,
        mode: LedgerHandlerMode.DMK,
      };
      for (const listener of capturedListeners) {
        try {
          (listener as any)(switchEvent, {}, jest.fn());
        } catch {
          // Some listeners may throw
        }
      }
      // Give the switch handler a tick to enter its await.
      await new Promise((r) => setTimeout(r, 0));

      // Now resolve ALL deferred inits so both bootstrap and the switch
      // can complete their createHandler calls.
      for (const resolve of initResolvers) {
        resolve();
      }

      // Wait for everything to settle. The switch's handler may also need
      // its init resolved (it re-uses the same mock which returns new
      // deferred promises per call).
      // Flush all pending microtasks.
      await bootstrapPromise;
      await new Promise((r) => setTimeout(r, 10));

      // Legacy handler was created only ONCE (by bootstrap's initLedger).
      // Without the guard it would be created twice: once by bootstrap and
      // once by switchLedgerHandler's Bug 1 guard path.
      const newLegacyCreates = initLegacyFn.mock.calls.length - legacyCreatesBefore;
      expect(newLegacyCreates).toBe(1);

      // DMK handler was created by the switch — confirming the final
      // handler is DMK, not the stale Legacy from the racing initLedger.
      const newDmkCreates = LedgerDMKBridgeHandler.mock.calls.length - dmkCreatesBefore;
      expect(newDmkCreates).toBe(1);

      // The DMK handler should be the active one routing messages.
      mockDmkHandleAction.mockResolvedValue("dmk-result");
      const sendResponse = jest.fn();
      capturedListener!(
        {
          target: OffscreenCommunicationTarget.ledgerOffscreen,
          action: LedgerAction.getPublicKey,
        },
        {},
        sendResponse,
      );
      await new Promise((r) => setTimeout(r, 0));
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        payload: "dmk-result",
      });
    });

    it("logs and continues when Legacy initialisation throws", async () => {
      const consoleLogSpy = jest.spyOn(console, "log");
      mockLegacyInit.mockReset();
      mockLegacyInit.mockRejectedValueOnce(new Error("legacy-failed"));

      await bootstrapLedger();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Ledger initialization failed:",
        expect.any(Error),
      );
      consoleLogSpy.mockRestore();
    });
  });

  // --- initLedger handler cleanup ---

  describe("initLedger handler lifecycle", () => {
    it("calls destroy() on the previous handler before overwriting with a new one", async () => {
      // initLedger should clean up any existing handler to prevent
      // leaks when called with a handler already active (e.g., the
      // Bug 1 concurrency case or Bug 4 timeout fallback).
      //
      // Note: module state (activeHandler) persists across tests, so
      // we track call deltas rather than absolute counts.
      await initLedger(LedgerHandlerMode.DMK);

      const dmkDestroyBefore = mockDmkDestroy.mock.calls.length;
      const legacyDestroyBefore = mockLegacyDestroy.mock.calls.length;

      // Calling initLedger again with Legacy should destroy the
      // existing DMK handler before creating the new one.
      await initLedger(LedgerHandlerMode.Legacy);
      expect(mockDmkDestroy.mock.calls.length).toBe(dmkDestroyBefore + 1);
      expect(mockLegacyDestroy.mock.calls.length).toBe(legacyDestroyBefore);
    });
  });
});
