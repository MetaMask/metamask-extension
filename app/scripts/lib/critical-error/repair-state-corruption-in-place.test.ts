import { RELOAD_WINDOW } from '../../../../shared/constants/start-up-errors';
import { CriticalErrorRepairAction } from '../../../../shared/constants/critical-error';
import type { Backup } from '../../../../shared/lib/stores/persistence-manager';
import { repairStateCorruptionInPlace } from './repair-state-corruption-in-place';

function createMockPort(): chrome.runtime.Port {
  return {
    postMessage: jest.fn(),
  } as unknown as chrome.runtime.Port;
}

describe('repairStateCorruptionInPlace', () => {
  const initBackground = jest.fn().mockResolvedValue(undefined);
  const backgroundIsInitialized = jest.fn().mockResolvedValue(undefined);
  const persistenceManager = {
    reset: jest.fn().mockResolvedValue(undefined),
  };
  const setGlobalInitializers = jest.fn();
  const setRestoreFlowType = jest.fn();
  const tryPostMessage = jest.fn().mockReturnValue(true);
  let callOrder: string[];

  beforeEach(() => {
    jest.clearAllMocks();
    callOrder = [];
    setGlobalInitializers.mockImplementation(() => {
      callOrder.push('setGlobalInitializers');
    });
    persistenceManager.reset.mockImplementation(async () => {
      callOrder.push('reset');
    });
    initBackground.mockImplementation(async () => {
      callOrder.push('initBackground');
    });
    backgroundIsInitialized.mockImplementation(async () => {
      callOrder.push('backgroundIsInitialized');
    });
  });

  it('recovers from backup in place and reloads connected UI windows', async () => {
    const backup: Backup = {
      KeyringController: { vault: 'vault-data' },
    };
    const port1 = createMockPort();
    const port2 = createMockPort();
    const connectedPorts = new Set([port1, port2]);

    await repairStateCorruptionInPlace({
      repairAction: CriticalErrorRepairAction.Recover,
      backup,
      connectedPorts,
      initBackground,
      backgroundIsInitialized,
      persistenceManager,
      setGlobalInitializers,
      setRestoreFlowType,
      tryPostMessage,
    });

    expect(callOrder).toEqual([
      'setGlobalInitializers',
      'initBackground',
      'backgroundIsInitialized',
    ]);
    expect(initBackground).toHaveBeenCalledWith(backup);
    expect(setRestoreFlowType).toHaveBeenCalledTimes(1);
    expect(persistenceManager.reset).not.toHaveBeenCalled();
    expect(tryPostMessage).toHaveBeenCalledWith(port1, RELOAD_WINDOW);
    expect(tryPostMessage).toHaveBeenCalledWith(port2, RELOAD_WINDOW);
  });

  it('resets persistence before replacing the initializer', async () => {
    const port = createMockPort();
    const connectedPorts = new Set([port]);

    await repairStateCorruptionInPlace({
      repairAction: CriticalErrorRepairAction.Reset,
      backup: null,
      connectedPorts,
      initBackground,
      backgroundIsInitialized,
      persistenceManager,
      setGlobalInitializers,
      setRestoreFlowType,
      tryPostMessage,
    });

    expect(callOrder).toEqual([
      'reset',
      'setGlobalInitializers',
      'initBackground',
      'backgroundIsInitialized',
    ]);
    expect(initBackground).toHaveBeenCalledWith(null);
    expect(setRestoreFlowType).not.toHaveBeenCalled();
    expect(tryPostMessage).toHaveBeenCalledWith(port, RELOAD_WINDOW);
  });

  it('throws when recover is requested without a vault in backup', async () => {
    const backup: Backup = { KeyringController: {} };
    const connectedPorts = new Set<chrome.runtime.Port>();

    await expect(
      repairStateCorruptionInPlace({
        repairAction: CriticalErrorRepairAction.Recover,
        backup,
        connectedPorts,
        initBackground,
        backgroundIsInitialized,
        persistenceManager,
        setGlobalInitializers,
        setRestoreFlowType,
        tryPostMessage,
      }),
    ).rejects.toThrow('Unexpected state corruption repair action');

    expect(setGlobalInitializers).not.toHaveBeenCalled();
    expect(initBackground).not.toHaveBeenCalled();
    expect(tryPostMessage).not.toHaveBeenCalled();
  });

  it('reloads connected UI windows when recover initialization fails', async () => {
    const backup: Backup = {
      KeyringController: { vault: 'vault-data' },
    };
    const port1 = createMockPort();
    const port2 = createMockPort();
    const connectedPorts = new Set([port1, port2]);
    const initError = new Error('init failed');
    // Real initBackground catches initialize errors and rejects isInitialized
    // instead of throwing, so this mock models backgroundIsInitialized rejecting.
    backgroundIsInitialized.mockImplementation(async () => {
      callOrder.push('backgroundIsInitialized');
      throw initError;
    });

    await expect(
      repairStateCorruptionInPlace({
        repairAction: CriticalErrorRepairAction.Recover,
        backup,
        connectedPorts,
        initBackground,
        backgroundIsInitialized,
        persistenceManager,
        setGlobalInitializers,
        setRestoreFlowType,
        tryPostMessage,
      }),
    ).rejects.toThrow(initError);

    expect(initBackground).toHaveBeenCalledWith(backup);
    expect(setRestoreFlowType).not.toHaveBeenCalled();
    expect(tryPostMessage).toHaveBeenCalledWith(port1, RELOAD_WINDOW);
    expect(tryPostMessage).toHaveBeenCalledWith(port2, RELOAD_WINDOW);
  });

  it('does not replace the initializer when reset fails', async () => {
    const port = createMockPort();
    const connectedPorts = new Set([port]);
    const resetError = new Error('reset failed');
    persistenceManager.reset.mockImplementation(async () => {
      callOrder.push('reset');
      throw resetError;
    });

    await expect(
      repairStateCorruptionInPlace({
        repairAction: CriticalErrorRepairAction.Reset,
        backup: null,
        connectedPorts,
        initBackground,
        backgroundIsInitialized,
        persistenceManager,
        setGlobalInitializers,
        setRestoreFlowType,
        tryPostMessage,
      }),
    ).rejects.toThrow(resetError);

    expect(callOrder).toEqual(['reset']);
    expect(setGlobalInitializers).not.toHaveBeenCalled();
    expect(initBackground).not.toHaveBeenCalled();
    expect(tryPostMessage).toHaveBeenCalledWith(port, RELOAD_WINDOW);
  });
});
