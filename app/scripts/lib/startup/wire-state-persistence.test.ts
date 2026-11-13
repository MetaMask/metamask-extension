import { backedUpStateKeys } from '../../../../shared/lib/stores/persistence-manager';
import {
  wireStatePersistence,
  type WireStatePersistenceController,
} from './wire-state-persistence';

jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

jest.mock('../../../../shared/lib/stores/persistence-manager', () => ({
  backedUpStateKeys: ['KeyringController', 'AppMetadataController'] as const,
}));

jest.mock('@metamask/base-controller', () => {
  const actual = jest.requireActual('@metamask/base-controller') as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    deriveStateFromMetadata: jest.fn(() => ({ persisted: true })),
  };
});

const { captureException } = jest.requireMock(
  '../../../../shared/lib/sentry',
) as { captureException: jest.Mock };

const { deriveStateFromMetadata } = jest.requireMock(
  '@metamask/base-controller',
) as { deriveStateFromMetadata: jest.Mock };

type StoreListener = (...args: unknown[]) => unknown;

function createController(state: Record<string, unknown>) {
  const listeners = new Map<string, StoreListener[]>();
  const config: WireStatePersistenceController['store']['config'] = {};
  const call = jest.fn();

  const controller: WireStatePersistenceController = {
    store: {
      getState: () => state,
      config,
      on: (event: string, listener: StoreListener) => {
        const eventListeners = listeners.get(event) ?? [];
        eventListeners.push(listener);
        listeners.set(event, eventListeners);
      },
    },
    controllerMessenger: { call },
  };

  return {
    controller,
    config,
    call,
    emit: async (event: string, ...args: unknown[]) => {
      const eventListeners = listeners.get(event) ?? [];
      await Promise.all(eventListeners.map((listener) => listener(...args)));
    },
  };
}

describe('wireStatePersistence', () => {
  beforeEach(() => {
    captureException.mockClear();
  });

  it('persists split-storage controllers whose top-level keys changed during setup', async () => {
    const { controller } = createController({
      FooController: { a: 2 },
    });
    const update = jest.fn();
    const safePersist = jest.fn().mockResolvedValue(undefined);
    const sentry = { captureException: jest.fn() };

    wireStatePersistence({
      controller,
      persistenceManager: { storageKind: 'split', update },
      initState: { FooController: { a: 1 } },
      safePersist,
      sentry,
    });

    expect(update).toHaveBeenCalledWith('FooController', { a: 2 });
    expect(safePersist).toHaveBeenCalledWith();
    await Promise.resolve();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it('does not persist split storage when configuration did not change state', () => {
    const value = { a: 1 };
    const { controller } = createController({
      FooController: value,
    });
    const update = jest.fn();
    const safePersist = jest.fn().mockResolvedValue(undefined);

    wireStatePersistence({
      controller,
      persistenceManager: { storageKind: 'split', update },
      initState: { FooController: value },
      safePersist,
    });

    expect(update).not.toHaveBeenCalled();
    expect(safePersist).not.toHaveBeenCalled();
  });

  it('reports invalid controller state during setup', () => {
    const { controller } = createController({
      FooController: 'bad',
    });

    wireStatePersistence({
      controller,
      persistenceManager: { storageKind: 'split', update: jest.fn() },
      initState: {},
      safePersist: jest.fn().mockResolvedValue(undefined),
    });

    expect(captureException).toHaveBeenCalledWith(expect.any(Error));
  });

  it('updates persistence on split stateChange and re-persists sibling backup keys', async () => {
    const { controller, config, call, emit } = createController({
      FooController: { a: 1 },
    });
    const update = jest.fn();
    const safePersist = jest.fn().mockResolvedValue(undefined);

    for (const key of backedUpStateKeys) {
      config[key] = {
        metadata: {
          vault: {
            persist: true,
            includeInDebugSnapshot: false,
            includeInStateLogs: false,
            usedInUi: false,
          },
        },
      };
    }
    call.mockReturnValue({ vault: 'encrypted', isUnlocked: true });

    wireStatePersistence({
      controller,
      persistenceManager: { storageKind: 'split', update },
      initState: { FooController: { a: 1 } },
      safePersist,
    });

    await emit('stateChange', {
      controllerKey: 'KeyringController',
      newState: { vault: 'new' },
    });

    expect(update).toHaveBeenCalledWith('KeyringController', {
      vault: 'new',
    });
    expect(call).toHaveBeenCalledTimes(backedUpStateKeys.length - 1);
    expect(deriveStateFromMetadata).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(backedUpStateKeys[1], {
      persisted: true,
    });
    expect(safePersist).toHaveBeenCalled();
  });

  it('throws when a backed-up controller is missing metadata', async () => {
    const { controller, emit } = createController({
      FooController: { a: 1 },
    });

    wireStatePersistence({
      controller,
      persistenceManager: { storageKind: 'split', update: jest.fn() },
      initState: { FooController: { a: 1 } },
      safePersist: jest.fn().mockResolvedValue(undefined),
    });

    await expect(
      emit('stateChange', {
        controllerKey: 'KeyringController',
        newState: { vault: 'new' },
      }),
    ).rejects.toThrow(/controller metadata is required/u);
  });

  it('persists the full current state for data storage and subscribes to update', async () => {
    const currentState = { FooController: { a: 2 } };
    const { controller, emit } = createController(currentState);
    const update = jest.fn();
    const safePersist = jest.fn().mockResolvedValue(undefined);
    const sentry = { captureException: jest.fn() };

    wireStatePersistence({
      controller,
      persistenceManager: { storageKind: 'data', update },
      initState: { FooController: { a: 1 } },
      safePersist,
      sentry,
    });

    expect(safePersist).toHaveBeenCalledWith(currentState);

    await emit('update', currentState);
    expect(safePersist).toHaveBeenCalledTimes(2);
  });

  it('reports store errors to sentry', async () => {
    const { controller, emit } = createController({
      FooController: { a: 1 },
    });
    const sentry = { captureException: jest.fn() };
    const error = new Error('store failed');

    wireStatePersistence({
      controller,
      persistenceManager: { storageKind: 'split', update: jest.fn() },
      initState: { FooController: { a: 1 } },
      safePersist: jest.fn().mockResolvedValue(undefined),
      sentry,
    });

    await emit('error', error);

    expect(sentry.captureException).toHaveBeenCalledWith(error);
  });
});
