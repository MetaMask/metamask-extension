import { PerpsDataChannel } from './PerpsDataChannel';

// Polyfill crypto.randomUUID for jsdom
let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

type TestData = { value: number };

const INITIAL: TestData = { value: 0 };

function assertDefined<TValue>(value: TValue | null | undefined): TValue {
  if (value === null || value === undefined) {
    throw new Error('Expected value to be defined');
  }
  return value;
}

function createChannel(
  connectFn?: (callback: (data: TestData) => void) => () => void,
): PerpsDataChannel<TestData> {
  return new PerpsDataChannel<TestData>({
    connectFn: connectFn ?? (() => () => undefined),
    initialValue: INITIAL,
    name: 'test',
  });
}

describe('PerpsDataChannel', () => {
  describe('constructor / getCachedData / hasCachedData', () => {
    it('returns initialValue from getCachedData before any data is pushed', () => {
      const channel = createChannel();
      expect(channel.getCachedData()).toBe(INITIAL);
    });

    it('reports no cached data before any data is received', () => {
      const channel = createChannel();
      expect(channel.hasCachedData()).toBe(false);
    });

    it('uses "unnamed" when no name is provided', () => {
      const channel = new PerpsDataChannel({
        connectFn: () => () => undefined,
        initialValue: INITIAL,
      });
      expect(channel.getCachedData()).toBe(INITIAL);
    });
  });

  describe('subscribe', () => {
    it('delivers cached data immediately to new subscriber', () => {
      const channel = createChannel();
      channel.pushData({ value: 42 });

      const cb = jest.fn();
      channel.subscribe(cb);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith({ value: 42 });
    });

    it('does not deliver initial value to subscriber (only real data)', () => {
      const channel = createChannel();

      const cb = jest.fn();
      channel.subscribe(cb);

      expect(cb).not.toHaveBeenCalled();
    });

    it('connects to source on first subscriber', () => {
      const connectFn = jest.fn(() => jest.fn());
      const channel = createChannel(connectFn);

      channel.subscribe(jest.fn());

      expect(connectFn).toHaveBeenCalledTimes(1);
    });

    it('does not connect a second time for additional subscribers', () => {
      const connectFn = jest.fn(() => jest.fn());
      const channel = createChannel(connectFn);

      channel.subscribe(jest.fn());
      channel.subscribe(jest.fn());

      expect(connectFn).toHaveBeenCalledTimes(1);
    });

    it('notifies all subscribers when source pushes data', () => {
      let sourceCallback: ((data: TestData) => void) | null = null;
      const connectFn = (cb: (data: TestData) => void) => {
        sourceCallback = cb;
        return () => undefined;
      };
      const channel = createChannel(connectFn);

      const cb1 = jest.fn();
      const cb2 = jest.fn();
      channel.subscribe(cb1);
      channel.subscribe(cb2);

      assertDefined(sourceCallback)({ value: 99 });

      expect(cb1).toHaveBeenCalledWith({ value: 99 });
      expect(cb2).toHaveBeenCalledWith({ value: 99 });
    });

    it('updates cache when source pushes data', () => {
      let sourceCallback: ((data: TestData) => void) | null = null;
      const connectFn = (cb: (data: TestData) => void) => {
        sourceCallback = cb;
        return () => undefined;
      };
      const channel = createChannel(connectFn);

      channel.subscribe(jest.fn());
      assertDefined(sourceCallback)({ value: 77 });

      expect(channel.getCachedData()).toEqual({ value: 77 });
      expect(channel.hasCachedData()).toBe(true);
    });
  });

  describe('unsubscribe', () => {
    it('stops delivering data to unsubscribed callback', () => {
      let sourceCallback: ((data: TestData) => void) | null = null;
      const connectFn = (cb: (data: TestData) => void) => {
        sourceCallback = cb;
        return () => undefined;
      };
      const channel = createChannel(connectFn);

      const cb = jest.fn();
      const unsub = channel.subscribe(cb);

      assertDefined(sourceCallback)({ value: 1 });
      expect(cb).toHaveBeenCalledTimes(1);

      unsub();
      assertDefined(sourceCallback)({ value: 2 });

      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('disconnects from source when last subscriber leaves', () => {
      const sourceUnsub = jest.fn();
      const connectFn = () => sourceUnsub;
      const channel = createChannel(connectFn);

      const unsub = channel.subscribe(jest.fn());
      unsub();

      expect(sourceUnsub).toHaveBeenCalledTimes(1);
    });

    it('does not disconnect when other subscribers remain', () => {
      const sourceUnsub = jest.fn();
      const connectFn = () => sourceUnsub;
      const channel = createChannel(connectFn);

      const unsub1 = channel.subscribe(jest.fn());
      channel.subscribe(jest.fn());

      unsub1();

      expect(sourceUnsub).not.toHaveBeenCalled();
    });

    it('preserves cache after disconnecting', () => {
      let sourceCallback: ((data: TestData) => void) | null = null;
      const connectFn = (cb: (data: TestData) => void) => {
        sourceCallback = cb;
        return () => undefined;
      };
      const channel = createChannel(connectFn);

      const unsub = channel.subscribe(jest.fn());
      assertDefined(sourceCallback)({ value: 55 });
      unsub();

      expect(channel.getCachedData()).toEqual({ value: 55 });
      expect(channel.hasCachedData()).toBe(true);
    });

    it('reconnects when a new subscriber arrives after disconnect', () => {
      const connectFn = jest.fn(() => jest.fn());
      const channel = createChannel(connectFn);

      const unsub = channel.subscribe(jest.fn());
      unsub();

      channel.subscribe(jest.fn());

      expect(connectFn).toHaveBeenCalledTimes(2);
    });

    it('does not disconnect when prewarm is active', () => {
      const sourceUnsub = jest.fn();
      const connectFn = () => sourceUnsub;
      const channel = createChannel(connectFn);

      channel.prewarm();

      const unsub = channel.subscribe(jest.fn());
      unsub();

      expect(sourceUnsub).not.toHaveBeenCalled();
    });
  });

  describe('pushData', () => {
    it('updates cache and notifies subscribers', () => {
      const channel = createChannel();

      const cb = jest.fn();
      channel.subscribe(cb);

      channel.pushData({ value: 10 });

      expect(cb).toHaveBeenCalledWith({ value: 10 });
      expect(channel.getCachedData()).toEqual({ value: 10 });
    });

    it('notifies multiple subscribers', () => {
      const channel = createChannel();

      const cb1 = jest.fn();
      const cb2 = jest.fn();
      channel.subscribe(cb1);
      channel.subscribe(cb2);

      channel.pushData({ value: 20 });

      expect(cb1).toHaveBeenCalledWith({ value: 20 });
      expect(cb2).toHaveBeenCalledWith({ value: 20 });
    });

    it('works without any subscribers (just updates cache)', () => {
      const channel = createChannel();

      channel.pushData({ value: 30 });

      expect(channel.getCachedData()).toEqual({ value: 30 });
    });
  });

  describe('clearCache', () => {
    it('resets cache to initial value', () => {
      const channel = createChannel();

      channel.pushData({ value: 100 });
      expect(channel.hasCachedData()).toBe(true);

      channel.clearCache();

      expect(channel.getCachedData()).toBe(INITIAL);
      expect(channel.hasCachedData()).toBe(false);
    });
  });

  describe('setConnectFn', () => {
    it('replaces the connect function used for new connections', () => {
      const connectFn1 = jest.fn(() => jest.fn());
      const connectFn2 = jest.fn(() => jest.fn());
      const channel = createChannel(connectFn1);

      const unsub = channel.subscribe(jest.fn());
      expect(connectFn1).toHaveBeenCalledTimes(1);

      unsub();

      channel.setConnectFn(connectFn2);
      channel.subscribe(jest.fn());

      expect(connectFn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('prewarm / isPrewarming', () => {
    it('keeps the channel connected even without UI subscribers', () => {
      const connectFn = jest.fn(() => jest.fn());
      const channel = createChannel(connectFn);

      channel.prewarm();

      expect(connectFn).toHaveBeenCalledTimes(1);
      expect(channel.isPrewarming()).toBe(true);
    });

    it('is idempotent — returns existing cleanup on second call', () => {
      const connectFn = jest.fn(() => jest.fn());
      const channel = createChannel(connectFn);

      const cleanup1 = channel.prewarm();
      const cleanup2 = channel.prewarm();

      expect(cleanup1).toBe(cleanup2);
      expect(connectFn).toHaveBeenCalledTimes(1);
    });

    it('stops prewarming when cleanup is called', () => {
      const connectFn = jest.fn(() => jest.fn());
      const channel = createChannel(connectFn);

      const cleanup = channel.prewarm();
      expect(channel.isPrewarming()).toBe(true);

      cleanup();

      expect(channel.isPrewarming()).toBe(false);
    });

    it('keeps connection alive when prewarm is active and UI subscriber leaves', () => {
      let sourceCallback: ((data: TestData) => void) | null = null;
      const sourceUnsub = jest.fn();
      const connectFn = (cb: (data: TestData) => void) => {
        sourceCallback = cb;
        return sourceUnsub;
      };
      const channel = createChannel(connectFn);

      channel.prewarm();

      const cb = jest.fn();
      const unsub = channel.subscribe(cb);

      assertDefined(sourceCallback)({ value: 5 });
      expect(cb).toHaveBeenCalledWith({ value: 5 });

      unsub();

      expect(sourceUnsub).not.toHaveBeenCalled();
    });

    it('caches data pushed during prewarm for later subscribers', () => {
      let sourceCallback: ((data: TestData) => void) | null = null;
      const connectFn = (cb: (data: TestData) => void) => {
        sourceCallback = cb;
        return () => undefined;
      };
      const channel = createChannel(connectFn);

      channel.prewarm();
      assertDefined(sourceCallback)({ value: 88 });

      const cb = jest.fn();
      channel.subscribe(cb);

      expect(cb).toHaveBeenCalledWith({ value: 88 });
    });
  });

  describe('reset', () => {
    it('disconnects, clears cache, and stops prewarming', () => {
      const sourceUnsub = jest.fn();
      let sourceCallback: ((data: TestData) => void) | null = null;
      const connectFn = (cb: (data: TestData) => void) => {
        sourceCallback = cb;
        return sourceUnsub;
      };
      const channel = createChannel(connectFn);

      channel.prewarm();
      assertDefined(sourceCallback)({ value: 42 });

      channel.reset();

      expect(sourceUnsub).toHaveBeenCalledTimes(1);
      expect(channel.getCachedData()).toBe(INITIAL);
      expect(channel.hasCachedData()).toBe(false);
      expect(channel.isPrewarming()).toBe(false);
    });

    it('is safe to call when not connected', () => {
      const channel = createChannel();
      expect(() => channel.reset()).not.toThrow();
    });

    it('allows re-subscription after reset', () => {
      const connectFn = jest.fn(() => jest.fn());
      const channel = createChannel(connectFn);

      channel.subscribe(jest.fn());
      channel.reset();

      channel.subscribe(jest.fn());

      expect(connectFn).toHaveBeenCalledTimes(2);
    });
  });
});
