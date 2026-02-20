import type { Patch } from 'immer';
import { ControllerStateProxy } from './controller-state-proxy';

type TestState = {
  tokens: string[];
  lastUpdated: number;
};

const makeState = (
  overrides?: Partial<TestState>,
): TestState => ({
  tokens: ['0xabc'],
  lastUpdated: 100,
  ...overrides,
});

describe('ControllerStateProxy', () => {
  describe('getSnapshot', () => {
    it('returns the initial state', () => {
      const state = makeState();
      const proxy = new ControllerStateProxy(state);
      expect(proxy.getSnapshot()).toBe(state);
    });

    it('is a stable reference (arrow property)', () => {
      const proxy = new ControllerStateProxy(makeState());
      expect(proxy.getSnapshot).toBe(proxy.getSnapshot);
    });
  });

  describe('subscribe', () => {
    it('is a stable reference (arrow property)', () => {
      const proxy = new ControllerStateProxy(makeState());
      expect(proxy.subscribe).toBe(proxy.subscribe);
    });

    it('returns an unsubscribe function', () => {
      const proxy = new ControllerStateProxy(makeState());
      const unsub = proxy.subscribe(jest.fn());
      expect(typeof unsub).toBe('function');
    });

    it('removes the listener when unsubscribe is called', () => {
      const proxy = new ControllerStateProxy(makeState());
      const listener = jest.fn();
      const unsub = proxy.subscribe(listener);

      proxy.setState(makeState({ lastUpdated: 200 }));
      proxy.notify();
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();

      proxy.setState(makeState({ lastUpdated: 300 }));
      proxy.notify();
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('applyPatches', () => {
    it('applies Immer patches to state', () => {
      const proxy = new ControllerStateProxy(makeState());
      const patches: Patch[] = [
        { op: 'replace', path: ['lastUpdated'], value: 999 },
      ];

      proxy.applyPatches(patches);

      expect(proxy.getSnapshot().lastUpdated).toBe(999);
    });

    it('preserves structural sharing for unchanged subtrees', () => {
      const initial = makeState();
      const proxy = new ControllerStateProxy(initial);

      proxy.applyPatches([
        { op: 'replace', path: ['lastUpdated'], value: 200 },
      ]);

      const updated = proxy.getSnapshot();
      expect(updated).not.toBe(initial);
      expect(updated.tokens).toBe(initial.tokens);
    });

    it('marks proxy as dirty', () => {
      const proxy = new ControllerStateProxy(makeState());
      expect(proxy.dirty).toBe(false);

      proxy.applyPatches([
        { op: 'replace', path: ['lastUpdated'], value: 200 },
      ]);

      expect(proxy.dirty).toBe(true);
    });

    it('does not notify subscribers', () => {
      const proxy = new ControllerStateProxy(makeState());
      const listener = jest.fn();
      proxy.subscribe(listener);

      proxy.applyPatches([
        { op: 'replace', path: ['lastUpdated'], value: 200 },
      ]);

      expect(listener).not.toHaveBeenCalled();
    });

    it('is a no-op for empty patches', () => {
      const initial = makeState();
      const proxy = new ControllerStateProxy(initial);

      proxy.applyPatches([]);

      expect(proxy.getSnapshot()).toBe(initial);
      expect(proxy.dirty).toBe(false);
    });
  });

  describe('setState', () => {
    it('replaces the state reference', () => {
      const proxy = new ControllerStateProxy(makeState());
      const next = makeState({ lastUpdated: 500 });

      proxy.setState(next);

      expect(proxy.getSnapshot()).toBe(next);
    });

    it('marks proxy as dirty', () => {
      const proxy = new ControllerStateProxy(makeState());

      proxy.setState(makeState({ lastUpdated: 500 }));

      expect(proxy.dirty).toBe(true);
    });

    it('does not notify subscribers', () => {
      const proxy = new ControllerStateProxy(makeState());
      const listener = jest.fn();
      proxy.subscribe(listener);

      proxy.setState(makeState({ lastUpdated: 500 }));

      expect(listener).not.toHaveBeenCalled();
    });

    it('is a no-op when the same reference is passed', () => {
      const state = makeState();
      const proxy = new ControllerStateProxy(state);

      proxy.setState(state);

      expect(proxy.dirty).toBe(false);
    });
  });

  describe('notify', () => {
    it('calls all subscribed listeners when dirty', () => {
      const proxy = new ControllerStateProxy(makeState());
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      proxy.subscribe(listener1);
      proxy.subscribe(listener2);

      proxy.setState(makeState({ lastUpdated: 200 }));
      proxy.notify();

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('resets dirty flag after notifying', () => {
      const proxy = new ControllerStateProxy(makeState());

      proxy.setState(makeState({ lastUpdated: 200 }));
      expect(proxy.dirty).toBe(true);

      proxy.notify();
      expect(proxy.dirty).toBe(false);
    });

    it('is a no-op when not dirty', () => {
      const proxy = new ControllerStateProxy(makeState());
      const listener = jest.fn();
      proxy.subscribe(listener);

      proxy.notify();

      expect(listener).not.toHaveBeenCalled();
    });

    it('does not re-notify on duplicate call without new changes', () => {
      const proxy = new ControllerStateProxy(makeState());
      const listener = jest.fn();
      proxy.subscribe(listener);

      proxy.setState(makeState({ lastUpdated: 200 }));
      proxy.notify();
      proxy.notify();

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('dirty', () => {
    it('is false initially', () => {
      const proxy = new ControllerStateProxy(makeState());
      expect(proxy.dirty).toBe(false);
    });

    it('becomes true after applyPatches', () => {
      const proxy = new ControllerStateProxy(makeState());
      proxy.applyPatches([
        { op: 'replace', path: ['lastUpdated'], value: 200 },
      ]);
      expect(proxy.dirty).toBe(true);
    });

    it('becomes true after setState with a new reference', () => {
      const proxy = new ControllerStateProxy(makeState());
      proxy.setState(makeState({ lastUpdated: 300 }));
      expect(proxy.dirty).toBe(true);
    });

    it('resets to false after notify', () => {
      const proxy = new ControllerStateProxy(makeState());
      proxy.setState(makeState({ lastUpdated: 300 }));
      proxy.notify();
      expect(proxy.dirty).toBe(false);
    });
  });
});
