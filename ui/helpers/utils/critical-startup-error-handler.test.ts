import type browser from 'webextension-polyfill';
import {
  APP_INIT_LIVENESS_METHOD,
  BACKGROUND_INITIALIZED_METHOD,
  BACKGROUND_LIVENESS_METHOD,
} from '../../../shared/constants/ui-initialization';
import {
  DISPLAY_GENERAL_STARTUP_ERROR,
  RELOAD_WINDOW,
} from '../../../shared/constants/start-up-errors';
import {
  CriticalErrorType,
  METHOD_DISPLAY_STATE_CORRUPTION_ERROR,
} from '../../../shared/constants/state-corruption';
import { CriticalStartupErrorHandler } from './critical-startup-error-handler';

const mockDisplayCriticalErrorMessage = jest.fn();
const mockDisplayStateCorruptionError = jest.fn();

jest.mock('./display-critical-error', () => ({
  displayCriticalErrorMessage: (...args: unknown[]) =>
    mockDisplayCriticalErrorMessage(...args),
  CriticalErrorTranslationKey: {
    TroubleStarting: 'troubleStarting',
    SomethingIsWrong: 'somethingIsWrong',
  },
}));

jest.mock('./state-corruption-html', () => ({
  displayStateCorruptionError: (...args: unknown[]) =>
    mockDisplayStateCorruptionError(...args),
}));

type MessageListener = (message: unknown) => void;

function createMockPort(): browser.Runtime.Port & {
  simulateMessage: (message: unknown) => void;
} {
  const messageListeners: MessageListener[] = [];

  return {
    name: 'popup',
    onMessage: {
      addListener: jest.fn((listener: MessageListener) => {
        messageListeners.push(listener);
      }),
      removeListener: jest.fn((listener: MessageListener) => {
        const index = messageListeners.indexOf(listener);
        if (index > -1) {
          messageListeners.splice(index, 1);
        }
      }),
      hasListener: jest.fn(),
      hasListeners: jest.fn(),
    },
    onDisconnect: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
      hasListeners: jest.fn(),
    },
    postMessage: jest.fn(),
    disconnect: jest.fn(),
    simulateMessage(message: unknown) {
      for (const listener of [...messageListeners]) {
        listener(message);
      }
    },
  } as unknown as browser.Runtime.Port & {
    simulateMessage: (message: unknown) => void;
  };
}

/**
 * Advance timers by the given amount and flush all pending microtasks.
 * Uses jest.advanceTimersByTimeAsync when available for proper timer+promise interleaving.
 *
 * @param ms - Milliseconds to advance timers by.
 */
async function advanceTimersAndFlush(ms: number): Promise<void> {
  await jest.advanceTimersByTimeAsync(ms);
}

/**
 * Flush all pending microtasks without advancing timers.
 */
async function flushMicrotasks(): Promise<void> {
  await jest.advanceTimersByTimeAsync(0);
}

describe('CriticalStartupErrorHandler', () => {
  let port: ReturnType<typeof createMockPort>;
  let container: HTMLElement;

  beforeEach(() => {
    jest.useFakeTimers();
    port = createMockPort();
    container = document.createElement('div');
    const rootContainer = document.createElement('div');
    rootContainer.appendChild(container);

    // Mock displayCriticalErrorMessage to resolve.
    // The real function returns Promise<never> (always throws), but in tests
    // we just need to verify it was called with the right arguments.
    mockDisplayCriticalErrorMessage.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Phase 1: Liveness check', () => {
    it('displays error when ALIVE message is not received within 15 seconds', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      await advanceTimersAndFlush(15_000);

      expect(mockDisplayCriticalErrorMessage).toHaveBeenCalledWith(
        container,
        'troubleStarting',
        expect.objectContaining({
          message: 'Background connection unresponsive',
        }),
        undefined,
        port,
        CriticalErrorType.BackgroundConnectionTimeout,
      );
    });

    it('does not display error when ALIVE is received before timeout', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      await advanceTimersAndFlush(5_000);
      port.simulateMessage({
        data: { method: BACKGROUND_LIVENESS_METHOD },
      });
      await flushMicrotasks();

      // After receiving ALIVE, the liveness error should not appear
      expect(mockDisplayCriticalErrorMessage).not.toHaveBeenCalledWith(
        container,
        'troubleStarting',
        expect.objectContaining({
          message: 'Background connection unresponsive',
        }),
      );

      // Clean up: uninstall to prevent initialization timeout from firing
      handler.uninstall();
    });
  });

  describe('Phase 2: Initialization check', () => {
    it('displays error when BACKGROUND_INITIALIZED_METHOD is not received within 16 seconds after ALIVE', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: { method: BACKGROUND_LIVENESS_METHOD },
      });
      await flushMicrotasks();

      await advanceTimersAndFlush(16_000);

      expect(mockDisplayCriticalErrorMessage).toHaveBeenCalledWith(
        container,
        'troubleStarting',
        expect.objectContaining({
          message: 'Background initialization timeout',
        }),
        undefined,
        port,
        CriticalErrorType.BackgroundInitTimeout,
      );
    });

    it('does not display error when BACKGROUND_INITIALIZED_METHOD is received before timeout', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: { method: BACKGROUND_LIVENESS_METHOD },
      });
      await flushMicrotasks();

      await advanceTimersAndFlush(5_000);
      port.simulateMessage({
        data: { method: BACKGROUND_INITIALIZED_METHOD },
      });
      await flushMicrotasks();

      expect(mockDisplayCriticalErrorMessage).not.toHaveBeenCalledWith(
        container,
        'troubleStarting',
        expect.objectContaining({
          message: 'Background initialization timeout',
        }),
        undefined,
        port,
      );

      handler.uninstall();
    });
  });

  describe('Phase 3: State sync check', () => {
    it('displays error when START_UI_SYNC is not received within 16 seconds after INITIALIZED', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: { method: BACKGROUND_LIVENESS_METHOD },
      });
      await flushMicrotasks();

      port.simulateMessage({
        data: { method: BACKGROUND_INITIALIZED_METHOD },
      });
      await flushMicrotasks();

      await advanceTimersAndFlush(16_000);

      expect(mockDisplayCriticalErrorMessage).toHaveBeenCalledWith(
        container,
        'troubleStarting',
        expect.objectContaining({
          message: 'Background state sync timeout',
        }),
        undefined,
        port,
        CriticalErrorType.BackgroundStateSyncTimeout,
      );
    });

    it('does not display error when startUiSyncReceived is called before timeout', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: { method: BACKGROUND_LIVENESS_METHOD },
      });
      await flushMicrotasks();

      port.simulateMessage({
        data: { method: BACKGROUND_INITIALIZED_METHOD },
      });
      await flushMicrotasks();

      await advanceTimersAndFlush(5_000);
      handler.startUiSyncReceived();
      await flushMicrotasks();

      await advanceTimersAndFlush(16_000);

      expect(mockDisplayCriticalErrorMessage).not.toHaveBeenCalledWith(
        container,
        'troubleStarting',
        expect.objectContaining({
          message: 'Background state sync timeout',
        }),
        undefined,
        port,
      );
    });
  });

  describe('Full successful flow', () => {
    it('completes all three phases without error when all messages arrive in time', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: { method: BACKGROUND_LIVENESS_METHOD },
      });
      // Allow the async chain from liveness check to propagate
      // and start the initialization check with its timeout.
      await advanceTimersAndFlush(100);

      port.simulateMessage({
        data: { method: BACKGROUND_INITIALIZED_METHOD },
      });
      // Allow the initialization check to complete and start state sync check.
      await advanceTimersAndFlush(100);

      handler.startUiSyncReceived();
      // Allow the state sync check to complete.
      await advanceTimersAndFlush(100);

      // No error should have been displayed at any point.
      expect(mockDisplayCriticalErrorMessage).not.toHaveBeenCalled();
    });

    it('completes successfully when ALIVE and BACKGROUND_INITIALIZED arrive before phase methods run', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      // Simulate race: both messages arrive back-to-back before we have entered
      // #startInitializationCheck (callbacks are pre-registered at install so both resolve).
      port.simulateMessage({
        data: { method: BACKGROUND_LIVENESS_METHOD },
      });
      port.simulateMessage({
        data: { method: BACKGROUND_INITIALIZED_METHOD },
      });
      await flushMicrotasks();

      // Let the async phase chain run (liveness completes, then init check awaits already-resolved promise).
      await advanceTimersAndFlush(100);

      handler.startUiSyncReceived();
      await advanceTimersAndFlush(100);

      // Should not show UnreachableInitializationCheck or any error.
      expect(mockDisplayCriticalErrorMessage).not.toHaveBeenCalled();
    });
  });

  describe('uninstall', () => {
    it('removes the message listener and clears all timeouts', () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      handler.uninstall();

      expect(port.onMessage.removeListener).toHaveBeenCalled();
    });

    it('does not display error after uninstall even if timeouts would fire', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      handler.uninstall();

      await advanceTimersAndFlush(50_000);

      expect(mockDisplayCriticalErrorMessage).not.toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('handles RELOAD_WINDOW by reloading the page', () => {
      const reloadMock = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: reloadMock },
        writable: true,
      });

      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: { method: RELOAD_WINDOW },
      });

      expect(reloadMock).toHaveBeenCalled();

      handler.uninstall();
    });

    it('handles METHOD_DISPLAY_STATE_CORRUPTION_ERROR', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: {
          method: METHOD_DISPLAY_STATE_CORRUPTION_ERROR,
          params: {
            error: { message: 'corruption', name: 'Error', stack: '' },
            hasBackup: true,
            currentLocale: 'en',
          },
        },
      });
      await flushMicrotasks();

      expect(mockDisplayStateCorruptionError).toHaveBeenCalledWith(
        container,
        port,
        { message: 'corruption', name: 'Error', stack: '' },
        true,
        'en',
      );

      handler.uninstall();
    });

    it('handles DISPLAY_GENERAL_STARTUP_ERROR with port', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: {
          method: DISPLAY_GENERAL_STARTUP_ERROR,
          params: {
            error: { message: 'startup error', name: 'Error', stack: '' },
            currentLocale: 'en',
          },
        },
      });
      await flushMicrotasks();

      expect(mockDisplayCriticalErrorMessage).toHaveBeenCalledWith(
        container,
        'troubleStarting',
        { message: 'startup error', name: 'Error', stack: '' },
        'en',
        port,
        CriticalErrorType.GeneralStartupError,
      );

      handler.uninstall();
    });

    it('ignores messages without data property', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({ something: 'else' });
      await flushMicrotasks();

      handler.uninstall();

      expect(mockDisplayCriticalErrorMessage).not.toHaveBeenCalled();
    });

    it('ignores messages without method property', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({ data: { notMethod: 'something' } });
      await flushMicrotasks();

      handler.uninstall();

      expect(mockDisplayCriticalErrorMessage).not.toHaveBeenCalled();
    });

    it('does not call displayStateCorruptionError when METHOD_DISPLAY_STATE_CORRUPTION_ERROR has no valid params', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: { method: METHOD_DISPLAY_STATE_CORRUPTION_ERROR },
      });
      await flushMicrotasks();

      expect(mockDisplayStateCorruptionError).not.toHaveBeenCalled();
      handler.uninstall();
    });

    it('does not call displayCriticalErrorMessage when DISPLAY_GENERAL_STARTUP_ERROR has no valid params', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: { method: DISPLAY_GENERAL_STARTUP_ERROR },
      });
      await flushMicrotasks();

      expect(mockDisplayCriticalErrorMessage).not.toHaveBeenCalled();
      handler.uninstall();
    });

    it('sets receivedAppInitPing when APP_INIT_LIVENESS_METHOD is received', async () => {
      const handler = new CriticalStartupErrorHandler(port, container);
      handler.install();

      port.simulateMessage({
        data: { method: APP_INIT_LIVENESS_METHOD },
      });
      await flushMicrotasks();

      // Advance past liveness timeout so Phase 1 would fire; error should include
      // sentryTags from #attachAppInitPingSentryTag (receivedAppInitPing true).
      await advanceTimersAndFlush(15_000);

      expect(mockDisplayCriticalErrorMessage).toHaveBeenCalledWith(
        container,
        'troubleStarting',
        expect.objectContaining({
          message: 'Background connection unresponsive',
        }),
        undefined,
        port,
        CriticalErrorType.BackgroundConnectionTimeout,
      );
      const capturedError = mockDisplayCriticalErrorMessage.mock.calls[0][2];
      expect(
        (capturedError as { sentryTags?: Record<string, string> }).sentryTags,
      ).toStrictEqual({ 'uiStartup.receivedAppInitPing': 'true' });
      handler.uninstall();
    });
  });
});
