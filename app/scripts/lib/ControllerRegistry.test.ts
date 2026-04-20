import type { Patch } from 'immer';
import { ControllerRegistry } from './ControllerRegistry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockController(
  name: string,
  state: Record<string, unknown>,
  persistFlags: Record<string, boolean> = {},
) {
  const metadata: Record<string, { persist: boolean; anonymous: boolean }> = {};
  for (const [key] of Object.entries(state)) {
    metadata[key] = { persist: persistFlags[key] ?? true, anonymous: false };
  }
  return { name, state, metadata };
}

function makeMockMessenger() {
  return {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ControllerRegistry', () => {
  let messenger: ReturnType<typeof makeMockMessenger>;

  beforeEach(() => {
    messenger = makeMockMessenger();
  });

  // -------------------------------------------------------------------------
  // Config accessors
  // -------------------------------------------------------------------------

  describe('uiConfig / persistConfig', () => {
    it('exposes the uiConfig passed at construction', () => {
      const uiConfig = { A: makeMockController('A', { x: 1 }) };
      const registry = new ControllerRegistry(messenger as never, uiConfig, {});
      expect(registry.uiConfig).toBe(uiConfig);
    });

    it('exposes the persistConfig passed at construction', () => {
      const persistConfig = { B: makeMockController('B', { y: 2 }) };
      const registry = new ControllerRegistry(
        messenger as never,
        {},
        persistConfig,
      );
      expect(registry.persistConfig).toBe(persistConfig);
    });
  });

  // -------------------------------------------------------------------------
  // getKeyedState
  // -------------------------------------------------------------------------

  describe('getKeyedState', () => {
    it('returns each controller\'s live state keyed by config key for "ui"', () => {
      const ctrlA = makeMockController('ControllerA', { value: 1 });
      const ctrlB = makeMockController('ControllerB', { value: 2 });
      const registry = new ControllerRegistry(
        messenger as never,
        { A: ctrlA, B: ctrlB },
        {},
      );
      expect(registry.getKeyedState('ui')).toStrictEqual({
        A: { value: 1 },
        B: { value: 2 },
      });
    });

    it('returns each controller\'s live state keyed by config key for "persist"', () => {
      const ctrlA = makeMockController('ControllerA', { value: 1 });
      const registry = new ControllerRegistry(
        messenger as never,
        {},
        { A: ctrlA },
      );
      expect(registry.getKeyedState('persist')).toStrictEqual({
        A: { value: 1 },
      });
    });

    it('reflects state mutations made after construction', () => {
      const ctrl = makeMockController('C', { value: 1 });
      const registry = new ControllerRegistry(
        messenger as never,
        { C: ctrl },
        {},
      );
      // Simulate an in-place state update (controllers mutate state references)
      (ctrl.state as Record<string, unknown>).value = 99;
      expect(registry.getKeyedState('ui').C).toStrictEqual({ value: 99 });
    });

    it('returns an empty record when the config has no controllers', () => {
      const registry = new ControllerRegistry(messenger as never, {}, {});
      expect(registry.getKeyedState('ui')).toStrictEqual({});
    });
  });

  // -------------------------------------------------------------------------
  // getPersistedState
  // -------------------------------------------------------------------------

  describe('getPersistedState', () => {
    it('includes properties whose metadata has persist: true', () => {
      const ctrl = makeMockController(
        'C',
        { a: 1, b: 2 },
        { a: true, b: true },
      );
      const registry = new ControllerRegistry(
        messenger as never,
        {},
        { C: ctrl },
      );
      const persisted = registry.getPersistedState();
      expect(persisted.C).toHaveProperty('a', 1);
      expect(persisted.C).toHaveProperty('b', 2);
    });

    it('excludes properties whose metadata has persist: false', () => {
      const ctrl = makeMockController(
        'C',
        { keep: 1, drop: 2 },
        { keep: true, drop: false },
      );
      const registry = new ControllerRegistry(
        messenger as never,
        {},
        { C: ctrl },
      );
      const persisted = registry.getPersistedState();
      expect(persisted.C).toHaveProperty('keep', 1);
      expect(persisted.C).not.toHaveProperty('drop');
    });
  });

  // -------------------------------------------------------------------------
  // subscribeAll
  // -------------------------------------------------------------------------

  describe('subscribeAll', () => {
    it('subscribes once per controller in the config', () => {
      const ctrlA = makeMockController('ControllerA', { x: 0 });
      const ctrlB = makeMockController('ControllerB', { y: 0 });
      const registry = new ControllerRegistry(
        messenger as never,
        { A: ctrlA, B: ctrlB },
        {},
      );
      registry.subscribeAll('ui', jest.fn());
      expect(messenger.subscribe).toHaveBeenCalledTimes(2);
    });

    it('subscribes to the correct stateChange event for each controller', () => {
      const ctrl = makeMockController('TokensController', { tokens: [] });
      const registry = new ControllerRegistry(
        messenger as never,
        { Tokens: ctrl },
        {},
      );
      registry.subscribeAll('ui', jest.fn());
      expect(messenger.subscribe).toHaveBeenCalledWith(
        'TokensController:stateChange',
        expect.any(Function),
      );
    });

    it('calls handler with (controllerKey, state, patches) when a stateChange fires', () => {
      const ctrl = makeMockController('ControllerA', { v: 0 });
      const registry = new ControllerRegistry(
        messenger as never,
        { A: ctrl },
        {},
      );
      const handler = jest.fn();
      registry.subscribeAll('ui', handler);

      // Simulate messenger firing the stateChange event
      const [[, wrappedHandler]] = messenger.subscribe.mock.calls;
      const newState = { v: 1 };
      const patches: Patch[] = [{ op: 'replace', path: ['v'], value: 1 }];
      wrappedHandler(newState, patches);

      expect(handler).toHaveBeenCalledWith('A', newState, patches);
    });

    it('returns one unsubscribe function per controller', () => {
      const ctrlA = makeMockController('A', {});
      const ctrlB = makeMockController('B', {});
      const registry = new ControllerRegistry(
        messenger as never,
        { A: ctrlA, B: ctrlB },
        {},
      );
      const unsubs = registry.subscribeAll('ui', jest.fn());
      expect(unsubs).toHaveLength(2);
    });

    it('calling an unsubscribe function removes its subscription', () => {
      const ctrl = makeMockController('ControllerA', {});
      const registry = new ControllerRegistry(
        messenger as never,
        { A: ctrl },
        {},
      );
      const [unsubscribe] = registry.subscribeAll('ui', jest.fn());
      unsubscribe();
      expect(messenger.unsubscribe).toHaveBeenCalledTimes(1);
      expect(messenger.unsubscribe).toHaveBeenCalledWith(
        'ControllerA:stateChange',
        expect.any(Function),
      );
    });

    it('unsubscribes the same wrapped handler that was subscribed', () => {
      const ctrl = makeMockController('ControllerA', {});
      const registry = new ControllerRegistry(
        messenger as never,
        { A: ctrl },
        {},
      );
      const [unsubscribe] = registry.subscribeAll('ui', jest.fn());
      unsubscribe();
      const subscribedHandler = messenger.subscribe.mock.calls[0][1];
      const unsubscribedHandler = messenger.unsubscribe.mock.calls[0][1];
      expect(subscribedHandler).toBe(unsubscribedHandler);
    });

    it('subscribes to the persist config when configName is "persist"', () => {
      const ctrl = makeMockController('PreferencesController', { pref: true });
      const registry = new ControllerRegistry(
        messenger as never,
        {},
        { Prefs: ctrl },
      );
      registry.subscribeAll('persist', jest.fn());
      expect(messenger.subscribe).toHaveBeenCalledWith(
        'PreferencesController:stateChange',
        expect.any(Function),
      );
    });
  });

  // -------------------------------------------------------------------------
  // scheduleOnStateChange
  // -------------------------------------------------------------------------

  describe('scheduleOnStateChange', () => {
    it('coalesces multiple stateChange events into a single microtask callback', async () => {
      const ctrlA = makeMockController('A', {});
      const ctrlB = makeMockController('B', {});
      const registry = new ControllerRegistry(
        messenger as never,
        { A: ctrlA, B: ctrlB },
        {},
      );
      const callback = jest.fn();
      registry.scheduleOnStateChange('ui', callback);

      // Both controllers fire in the same synchronous turn
      const [[, handlerA], [, handlerB]] = messenger.subscribe.mock.calls;
      handlerA({}, []);
      handlerB({}, []);

      // Still in the same synchronous turn — callback not yet called
      expect(callback).not.toHaveBeenCalled();

      // Flush the microtask queue
      await Promise.resolve();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('schedules a new callback for the next batch after flushing', async () => {
      const ctrl = makeMockController('A', {});
      const registry = new ControllerRegistry(
        messenger as never,
        { A: ctrl },
        {},
      );
      const callback = jest.fn();
      registry.scheduleOnStateChange('ui', callback);

      const [[, handler]] = messenger.subscribe.mock.calls;

      handler({}, []);
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(1);

      // Second batch
      handler({}, []);
      await Promise.resolve();
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('returns unsubscribe functions (one per controller)', () => {
      const ctrl = makeMockController('A', {});
      const registry = new ControllerRegistry(
        messenger as never,
        { A: ctrl },
        {},
      );
      const unsubs = registry.scheduleOnStateChange('ui', jest.fn());
      expect(unsubs).toHaveLength(1);
      expect(typeof unsubs[0]).toBe('function');
    });
  });
});
