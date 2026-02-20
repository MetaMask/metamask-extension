import type { Patch } from 'immer';
import type { Json } from '@metamask/utils';
import { ControllerRegistry } from './ControllerRegistry';
import type { ControllerConfig } from './ControllerRegistry';

/**
 * Minimal mock messenger that tracks subscribe/unsubscribe calls
 * and allows tests to fire events.
 */
function createMockMessenger() {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();

  return {
    subscribe: jest.fn(
      (event: string, handler: (...args: unknown[]) => void) => {
        if (!handlers.has(event)) {
          handlers.set(event, new Set());
        }
        handlers.get(event)!.add(handler);
      },
    ),
    unsubscribe: jest.fn(
      (event: string, handler: (...args: unknown[]) => void) => {
        handlers.get(event)?.delete(handler);
      },
    ),
    /** Fire an event to all subscribed handlers. */
    emit(event: string, ...args: unknown[]) {
      handlers.get(event)?.forEach((fn) => fn(...args));
    },
    /** Number of handlers for an event. */
    listenerCount(event: string) {
      return handlers.get(event)?.size ?? 0;
    },
  };
}

/**
 * Create a mock that satisfies `BaseControllerInstance`.
 * All metadata fields default to a sensible baseline.
 */
function createMockController(
  name: string,
  state: Record<string, Json>,
  metadata?: Record<
    string,
    {
      persist?: boolean;
      includeInDebugSnapshot?: boolean;
      includeInStateLogs?: boolean;
      usedInUi?: boolean;
    }
  >,
) {
  const fullMetadata: Record<
    string,
    {
      persist: boolean;
      includeInDebugSnapshot: boolean;
      includeInStateLogs: boolean;
      usedInUi: boolean;
    }
  > = {};

  for (const key of Object.keys(state)) {
    fullMetadata[key] = {
      persist: metadata?.[key]?.persist ?? true,
      includeInDebugSnapshot:
        metadata?.[key]?.includeInDebugSnapshot ?? true,
      includeInStateLogs: metadata?.[key]?.includeInStateLogs ?? true,
      usedInUi: metadata?.[key]?.usedInUi ?? true,
    };
  }

  return { name, state, metadata: fullMetadata };
}

describe('ControllerRegistry', () => {
  const makeRegistry = (
    overrides: {
      uiConfig?: ControllerConfig;
      persistConfig?: ControllerConfig;
    } = {},
  ) => {
    const messenger = createMockMessenger();

    const uiConfig = (overrides.uiConfig ?? {
      TokensController: createMockController('TokensController', {
        tokens: ['0xabc'],
        lastUpdated: 100,
      }),
      NetworkController: createMockController('NetworkController', {
        chainId: '0x1',
        selectedNetworkClientId: 'mainnet',
      }),
    }) as ControllerConfig;

    const persistConfig = (overrides.persistConfig ?? {
      PreferencesController: createMockController(
        'PreferencesController',
        { theme: 'dark', secretKey: 'abc123' },
        { theme: { persist: true }, secretKey: { persist: false } },
      ),
      NetworkController: createMockController(
        'NetworkController',
        { chainId: '0x1', selectedNetworkClientId: 'mainnet' },
        {
          chainId: { persist: true },
          selectedNetworkClientId: { persist: true },
        },
      ),
    }) as ControllerConfig;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = new ControllerRegistry(
      messenger as any,
      uiConfig,
      persistConfig,
    );
    return { messenger, registry, uiConfig, persistConfig };
  };

  // ---------------------------------------------------------------------------
  // Config access
  // ---------------------------------------------------------------------------

  describe('config access', () => {
    it('exposes uiConfig', () => {
      const { registry, uiConfig } = makeRegistry();
      expect(registry.uiConfig).toBe(uiConfig);
    });

    it('exposes persistConfig', () => {
      const { registry, persistConfig } = makeRegistry();
      expect(registry.persistConfig).toBe(persistConfig);
    });
  });

  // ---------------------------------------------------------------------------
  // getKeyedState
  // ---------------------------------------------------------------------------

  describe('getKeyedState', () => {
    it('returns keyed state from UI config', () => {
      const { registry } = makeRegistry();
      const keyed = registry.getKeyedState('ui');

      expect(keyed).toEqual({
        TokensController: { tokens: ['0xabc'], lastUpdated: 100 },
        NetworkController: {
          chainId: '0x1',
          selectedNetworkClientId: 'mainnet',
        },
      });
    });

    it('returns keyed state from persist config', () => {
      const { registry } = makeRegistry();
      const keyed = registry.getKeyedState('persist');

      expect(keyed).toEqual({
        PreferencesController: { theme: 'dark', secretKey: 'abc123' },
        NetworkController: {
          chainId: '0x1',
          selectedNetworkClientId: 'mainnet',
        },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getPersistedState
  // ---------------------------------------------------------------------------

  describe('getPersistedState', () => {
    it('filters state through persist metadata', () => {
      const { registry } = makeRegistry();
      const persisted = registry.getPersistedState();

      expect(persisted.PreferencesController).toEqual({ theme: 'dark' });
      expect(persisted.NetworkController).toEqual({
        chainId: '0x1',
        selectedNetworkClientId: 'mainnet',
      });
    });

    it('returns full state when all properties have persist: true', () => {
      const { registry } = makeRegistry({
        persistConfig: {
          Plain: createMockController('Plain', { foo: 'bar' }),
        } as ControllerConfig,
      });

      expect(registry.getPersistedState()).toEqual({
        Plain: { foo: 'bar' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // subscribeAll
  // ---------------------------------------------------------------------------

  describe('subscribeAll', () => {
    it('subscribes to all named controllers in the config', () => {
      const { messenger, registry } = makeRegistry();
      registry.subscribeAll('ui', jest.fn());

      expect(messenger.subscribe).toHaveBeenCalledWith(
        'TokensController:stateChange',
        expect.any(Function),
      );
      expect(messenger.subscribe).toHaveBeenCalledWith(
        'NetworkController:stateChange',
        expect.any(Function),
      );
    });

    it('forwards controllerKey, state, and patches to handler', () => {
      const { messenger, registry } = makeRegistry();
      const handler = jest.fn();
      registry.subscribeAll('ui', handler);

      const patches: Patch[] = [
        { op: 'replace', path: ['tokens'], value: [] },
      ];
      messenger.emit('TokensController:stateChange', { tokens: [] }, patches);

      expect(handler).toHaveBeenCalledWith(
        'TokensController',
        { tokens: [] },
        patches,
      );
    });

    it('returns unsubscribe functions that remove handlers', () => {
      const { messenger, registry } = makeRegistry();
      const unsubs = registry.subscribeAll('ui', jest.fn());

      expect(
        messenger.listenerCount('TokensController:stateChange'),
      ).toBe(1);

      unsubs.forEach((fn) => fn());

      expect(messenger.unsubscribe).toHaveBeenCalledTimes(2);
      expect(
        messenger.listenerCount('TokensController:stateChange'),
      ).toBe(0);
      expect(
        messenger.listenerCount('NetworkController:stateChange'),
      ).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // scheduleOnStateChange
  // ---------------------------------------------------------------------------

  describe('scheduleOnStateChange', () => {
    it('coalesces multiple stateChange events into one callback', async () => {
      const { messenger, registry } = makeRegistry();
      const callback = jest.fn();
      registry.scheduleOnStateChange('ui', callback);

      messenger.emit('TokensController:stateChange', {}, []);
      messenger.emit('NetworkController:stateChange', {}, []);

      expect(callback).not.toHaveBeenCalled();

      await Promise.resolve();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('allows subsequent batches after microtask completes', async () => {
      const { messenger, registry } = makeRegistry();
      const callback = jest.fn();
      registry.scheduleOnStateChange('ui', callback);

      messenger.emit('TokensController:stateChange', {}, []);
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(1);

      messenger.emit('NetworkController:stateChange', {}, []);
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('returns unsubscribe functions', () => {
      const { messenger, registry } = makeRegistry();
      const unsubs = registry.scheduleOnStateChange('ui', jest.fn());

      unsubs.forEach((fn) => fn());

      expect(
        messenger.listenerCount('TokensController:stateChange'),
      ).toBe(0);
      expect(
        messenger.listenerCount('NetworkController:stateChange'),
      ).toBe(0);
    });
  });
});
