import {
  CRITICAL_ERROR_SCREEN_VIEWED,
  RELOAD_WINDOW,
} from '../../../../shared/constants/start-up-errors';
import {
  CriticalErrorType,
  METHOD_REPAIR_DATABASE_TIMEOUT,
} from '../../../../shared/constants/state-corruption';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import type { Backup } from '../../../../shared/lib/backup';
import { captureException } from '../../../../shared/lib/sentry';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { tryPostMessage } from '../start-up-errors/start-up-errors';
import {
  CriticalErrorHandler,
  RegisterPortForCriticalErrorConfig,
} from './critical-error-recovery';
import { trackCriticalErrorEvent } from './track-critical-error';

jest.mock('./track-critical-error', () => ({
  trackCriticalErrorEvent: jest.fn(),
}));

jest.mock('../start-up-errors/start-up-errors', () => ({
  tryPostMessage: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

jest.mock('../repair', () => {
  const { RELOAD_WINDOW: RELOAD } = jest.requireActual(
    '../../../../shared/constants/start-up-errors',
  );
  const { tryPostMessage: tryPostMessageMock } = jest.requireMock(
    '../start-up-errors/start-up-errors',
  );
  return {
    runRepairAndReloadPorts: jest.fn(
      async (
        backup: unknown,
        repairCallback: (b: unknown) => void | Promise<void>,
        connectedPorts: Set<chrome.runtime.Port>,
      ) => {
        await repairCallback(backup);
        connectedPorts.forEach((port) => tryPostMessageMock(port, RELOAD));
      },
    ),
  };
});

function createMockPort(): chrome.runtime.Port {
  const messageListeners: ((message: unknown) => void)[] = [];
  const disconnectListeners: (() => void)[] = [];
  return {
    name: 'test-port',
    onMessage: {
      addListener: jest.fn((listener: (message: unknown) => void) => {
        messageListeners.push(listener);
      }),
      removeListener: jest.fn((listener: (message: unknown) => void) => {
        const i = messageListeners.indexOf(listener);
        if (i !== -1) {
          messageListeners.splice(i, 1);
        }
      }),
    },
    onDisconnect: {
      addListener: jest.fn((listener: () => void) => {
        disconnectListeners.push(listener);
      }),
    },
    postMessage: jest.fn(),
    disconnect: jest.fn(),
    sender: undefined,
    // Test helper: simulate message from UI
    emitTestMessage(message: unknown) {
      messageListeners.forEach((fn) => fn(message));
    },
  } as unknown as chrome.runtime.Port;
}

function createConfig(
  overrides: Partial<RegisterPortForCriticalErrorConfig> = {},
): RegisterPortForCriticalErrorConfig {
  const port = createMockPort();
  const repairCallback = jest.fn().mockResolvedValue(undefined);
  return { port, repairCallback, ...overrides };
}

describe('CriticalErrorHandler', () => {
  let handler: CriticalErrorHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CriticalErrorHandler();
  });

  describe('registerPortForCriticalError', () => {
    it('adds port to connectedPorts and attaches message and disconnect listeners', () => {
      const { port, repairCallback } = createConfig();

      handler.registerPortForCriticalError({ port, repairCallback });

      expect(handler.connectedPorts.has(port)).toBe(true);
      expect(handler.connectedPorts.size).toBe(1);
      expect(port.onMessage.addListener).toHaveBeenCalledTimes(2);
      expect(port.onDisconnect.addListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeListenersForPort', () => {
    it('removes message listeners and deletes port from connectedPorts', () => {
      const config = createConfig();
      handler.registerPortForCriticalError(config);

      handler.removeListenersForPort(config.port);

      expect(handler.connectedPorts.has(config.port)).toBe(false);
      expect(config.port.onMessage.removeListener).toHaveBeenCalledTimes(2);
    });

    it('is idempotent when called twice', () => {
      const config = createConfig();
      handler.registerPortForCriticalError(config);

      handler.removeListenersForPort(config.port);
      handler.removeListenersForPort(config.port);

      expect(handler.connectedPorts.size).toBe(0);
    });
  });

  describe('when port receives METHOD_REPAIR_DATABASE_TIMEOUT', () => {
    it('calls repairCallback with backup and sends RELOAD_WINDOW to connectedPorts', async () => {
      const backup: Backup = { KeyringController: {} };
      const repairCallback = jest.fn().mockResolvedValue(undefined);
      const config = createConfig({ repairCallback });

      handler.registerPortForCriticalError(config);

      const portWithEmit = config.port as chrome.runtime.Port & {
        emitTestMessage: (message: unknown) => void;
      };
      portWithEmit.emitTestMessage({
        data: {
          method: METHOD_REPAIR_DATABASE_TIMEOUT,
          params: {
            criticalErrorType: CriticalErrorType.BackgroundInitTimeout,
            backup,
          },
        },
      });

      await flushPromises();

      expect(repairCallback).toHaveBeenCalledWith(backup);
      expect(jest.mocked(tryPostMessage)).toHaveBeenCalledWith(
        config.port,
        RELOAD_WINDOW,
      );
      expect(jest.mocked(trackCriticalErrorEvent)).toHaveBeenCalledWith(
        backup,
        MetaMetricsEventName.CriticalErrorRestoreWalletButtonPressed,
        CriticalErrorType.BackgroundInitTimeout,
      );
    });

    it('uses backup from params when present', async () => {
      const backupFromUi: Backup = {
        KeyringController: { vault: 'from-ui' },
        AppMetadataController: {},
        MetaMetricsController: {},
      };
      const repairCallback = jest.fn().mockResolvedValue(undefined);
      const config = createConfig({ repairCallback });

      handler.registerPortForCriticalError(config);

      const portWithEmit = config.port as chrome.runtime.Port & {
        emitTestMessage: (message: unknown) => void;
      };
      portWithEmit.emitTestMessage({
        data: {
          method: METHOD_REPAIR_DATABASE_TIMEOUT,
          params: {
            criticalErrorType: CriticalErrorType.BackgroundInitTimeout,
            backup: backupFromUi,
          },
        },
      });

      await flushPromises();

      expect(repairCallback).toHaveBeenCalledWith(backupFromUi);
    });

    it('returns without restoring when params.backup is missing', async () => {
      const repairCallback = jest.fn().mockResolvedValue(undefined);
      const config = createConfig({ repairCallback });
      handler.registerPortForCriticalError(config);

      const portWithEmit = config.port as chrome.runtime.Port & {
        emitTestMessage: (message: unknown) => void;
      };
      portWithEmit.emitTestMessage({
        data: {
          method: METHOD_REPAIR_DATABASE_TIMEOUT,
          params: {
            criticalErrorType: CriticalErrorType.BackgroundInitTimeout,
          },
        },
      });

      await flushPromises();

      expect(repairCallback).not.toHaveBeenCalled();
      expect(jest.mocked(captureException)).not.toHaveBeenCalled();
    });

    it('removes listeners from all connected ports before repair', async () => {
      const backup: Backup = { KeyringController: {} };
      const config1 = createConfig();
      const config2 = createConfig();
      handler.registerPortForCriticalError(config1);
      handler.registerPortForCriticalError(config2);

      const portWithEmit = config1.port as chrome.runtime.Port & {
        emitTestMessage: (message: unknown) => void;
      };
      portWithEmit.emitTestMessage({
        data: {
          method: METHOD_REPAIR_DATABASE_TIMEOUT,
          params: { backup },
        },
      });

      await flushPromises();

      expect(config1.port.onMessage.removeListener).toHaveBeenCalled();
      expect(config2.port.onMessage.removeListener).toHaveBeenCalled();
      expect(jest.mocked(tryPostMessage)).toHaveBeenCalledWith(
        config1.port,
        RELOAD_WINDOW,
      );
      expect(jest.mocked(tryPostMessage)).toHaveBeenCalledWith(
        config2.port,
        RELOAD_WINDOW,
      );
    });
  });

  describe('when port receives CRITICAL_ERROR_SCREEN_VIEWED', () => {
    it('tracks event with backup and criticalErrorType', async () => {
      const backup: Backup = { KeyringController: {} };
      const config = createConfig();

      handler.registerPortForCriticalError(config);

      const portWithEmit = config.port as chrome.runtime.Port & {
        emitTestMessage: (message: unknown) => void;
      };
      portWithEmit.emitTestMessage({
        data: {
          method: CRITICAL_ERROR_SCREEN_VIEWED,
          params: {
            backup,
            canTriggerRestore: true,
            criticalErrorType: CriticalErrorType.BackgroundStateSyncTimeout,
          },
        },
      });

      await flushPromises();

      expect(jest.mocked(trackCriticalErrorEvent)).toHaveBeenCalledWith(
        backup,
        MetaMetricsEventName.CriticalErrorScreenViewed,
        CriticalErrorType.BackgroundStateSyncTimeout,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { restore_accounts_enabled: true },
      );
    });
  });
});
