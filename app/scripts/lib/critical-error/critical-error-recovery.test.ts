import { CRITICAL_ERROR_SCREEN_VIEWED } from '../../../../shared/constants/start-up-errors';
import {
  CriticalErrorType,
  METHOD_REPAIR_DATABASE_TIMEOUT,
} from '../../../../shared/constants/state-corruption';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import type { Backup } from '../../../../shared/lib/stores/persistence-manager';
import { captureException } from '../../../../shared/lib/sentry';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import {
  CriticalErrorHandler,
  RegisterPortForCriticalErrorConfig,
} from './critical-error-recovery';
import { trackCriticalErrorEvent } from './track-critical-error';

jest.mock('./track-critical-error', () => ({
  trackCriticalErrorEvent: jest.fn(),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

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
      removeListener: jest.fn((listener: () => void) => {
        const i = disconnectListeners.indexOf(listener);
        if (i !== -1) {
          disconnectListeners.splice(i, 1);
        }
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
  const repairCallback = jest.fn().mockResolvedValue(true);
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
      const config = createConfig();

      handler.registerPortForCriticalError(config);

      expect(handler.connectedPorts.has(config.port)).toBe(true);
      expect(handler.connectedPorts.size).toBe(1);
      expect(config.port.onMessage.addListener).toHaveBeenCalledTimes(2);
      expect(config.port.onDisconnect.addListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeListenersForPort', () => {
    it('removes message listeners and deletes port from connectedPorts', () => {
      const config = createConfig();
      handler.registerPortForCriticalError(config);

      handler.removeListenersForPort(config.port);

      expect(handler.connectedPorts.has(config.port)).toBe(false);
      expect(config.port.onMessage.removeListener).toHaveBeenCalledTimes(2);
      expect(config.port.onDisconnect.removeListener).toHaveBeenCalledTimes(1);
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
    it('calls repairCallback and tracks restore click', async () => {
      const backup: Backup = { KeyringController: {} };
      const repairCallback = jest.fn().mockResolvedValue(true);
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

      expect(repairCallback).toHaveBeenCalledWith();
      expect(jest.mocked(trackCriticalErrorEvent)).toHaveBeenCalledWith(
        backup,
        MetaMetricsEventName.CriticalErrorRestoreWalletButtonPressed,
        CriticalErrorType.BackgroundInitTimeout,
      );
      expect(handler.connectedPorts.size).toBe(0);
    });

    it('uses backup from params for analytics', async () => {
      const backupFromUi: Backup = {
        KeyringController: { vault: 'from-ui' },
        AppMetadataController: {},
        MetaMetricsController: {},
      };
      const repairCallback = jest.fn().mockResolvedValue(true);
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

      expect(repairCallback).toHaveBeenCalled();
      expect(jest.mocked(trackCriticalErrorEvent)).toHaveBeenCalledWith(
        backupFromUi,
        MetaMetricsEventName.CriticalErrorRestoreWalletButtonPressed,
        CriticalErrorType.BackgroundInitTimeout,
      );
    });

    it('returns without restoring when params.backup is missing', async () => {
      const repairCallback = jest.fn().mockResolvedValue(true);
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

    it('removes listeners from all connected ports before restore', async () => {
      const backup: Backup = { KeyringController: {} };
      const sharedRestore = jest.fn().mockResolvedValue(true);
      const config1 = createConfig({ repairCallback: sharedRestore });
      const config2 = createConfig({ repairCallback: sharedRestore });
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
      expect(sharedRestore).toHaveBeenCalledTimes(1);
      expect(handler.connectedPorts.size).toBe(0);
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
