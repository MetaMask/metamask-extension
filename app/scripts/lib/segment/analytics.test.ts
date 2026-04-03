import Analytics from './analytics';

const DUMMY_KEY = 'DUMMY_KEY';
const DUMMY_MESSAGE = {
  userId: 'userId',
  idValue: 'idValue',
  event: 'event',
};
const FLUSH_INTERVAL = 10000;

function defaultFetchSuccess(): Promise<Response> {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  } as Response);
}

function installSyncSetImmediate(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).setImmediate = (arg: () => void) => {
    arg();
  };
}

installSyncSetImmediate();

describe('Analytics', function () {
  let analytics: Analytics;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn().mockImplementation(defaultFetchSuccess);
    globalThis.fetch = mockFetch;
    analytics = new Analytics(DUMMY_KEY);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    installSyncSetImmediate();
  });

  describe('constructor', () => {
    it('uses a minimum flushAt of 1 when 0 is passed', () => {
      const instance = new Analytics(DUMMY_KEY, { flushAt: 0 });
      expect(instance.flushAt).toBe(1);
    });

    it('strips a trailing slash from the host option', () => {
      const instance = new Analytics(DUMMY_KEY, {
        host: 'https://custom.segment.example/',
      });
      expect(instance.host).toBe('https://custom.segment.example');
    });
  });

  describe('#enqueue', () => {
    it('stringifies non-string anonymousId and userId for the batch payload', async () => {
      jest
        .spyOn(Analytics.prototype, '_validate')
        .mockImplementation(() => undefined);
      analytics = new Analytics(DUMMY_KEY);
      const callback = jest.fn();
      analytics.track(
        {
          event: 'Test Event',
          anonymousId: { a: 1 },
          userId: { id: 'x' },
        },
        callback,
      );
      await analytics.flush();
      expect(callback).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          batch: [
            expect.objectContaining({
              anonymousId: JSON.stringify({ a: 1 }),
              userId: JSON.stringify({ id: 'x' }),
            }),
          ],
        }),
      );
    });
  });

  describe('#flush', function () {
    it('first message is immediately flushed', function () {
      const mock = jest.fn(analytics.flush.bind(analytics));
      analytics.flush = mock;
      analytics.track(DUMMY_MESSAGE);
      expect(analytics.queue).toHaveLength(0);
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it('after first message it is called when queue size equals flushAt value', function () {
      analytics = new Analytics(DUMMY_KEY, { flushAt: 3 });
      const mock = jest.fn(analytics.flush.bind(analytics));
      analytics.flush = mock;
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE);
      expect(analytics.queue).toHaveLength(0);
      expect(mock).toHaveBeenCalledTimes(2);
    });

    it('except for first message it is called until queue size is less than flushAt value', function () {
      analytics = new Analytics(DUMMY_KEY, { flushAt: 3 });
      const mock = jest.fn(analytics.flush.bind(analytics));
      analytics.flush = mock;
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE);
      expect(analytics.queue).toHaveLength(2);
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it('after first message it is called after flushInterval is elapsed', function () {
      jest.useFakeTimers();
      analytics = new Analytics(DUMMY_KEY, { flushInterval: FLUSH_INTERVAL });
      const mock = jest.fn(analytics.flush.bind(analytics));
      analytics.flush = mock;
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE);
      jest.advanceTimersByTime(FLUSH_INTERVAL);
      expect(analytics.queue).toHaveLength(0);
      expect(mock).toHaveBeenCalledTimes(2);
    });

    it('after first message it is not called until flushInterval is elapsed', function () {
      jest.useFakeTimers();
      analytics = new Analytics(DUMMY_KEY, { flushInterval: FLUSH_INTERVAL });
      const mock = jest.fn(analytics.flush.bind(analytics));
      analytics.flush = mock;
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE);
      jest.advanceTimersByTime(FLUSH_INTERVAL - 100);
      expect(analytics.queue).toHaveLength(1);
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it('invokes callbacks', async function () {
      const callback = jest.fn();
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE, callback);
      await analytics.flush();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('resolves when the queue is already empty', async () => {
      await expect(analytics.flush()).resolves.toBeUndefined();
    });

    it('clears a scheduled flush timer when flush runs', async () => {
      jest.useFakeTimers();
      analytics = new Analytics(DUMMY_KEY, {
        flushInterval: FLUSH_INTERVAL,
        flushAt: 10,
      });
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE);
      expect(analytics.timer).not.toBeNull();
      await analytics.flush();
      expect(analytics.timer).toBeNull();
    });

    it('preserves timestamp and messageId when already set on the message', async () => {
      const timestamp = new Date('2020-05-01T12:00:00.000Z');
      const callback = jest.fn();
      analytics.track(
        {
          event: 'Test Event',
          userId: 'u',
          timestamp,
          messageId: 'preset-msg-id',
        },
        callback,
      );
      await analytics.flush();
      expect(callback).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          batch: [
            expect.objectContaining({
              timestamp,
              messageId: 'preset-msg-id',
            }),
          ],
        }),
      );
    });

    it('posts to the configured host and path', async () => {
      analytics = new Analytics(DUMMY_KEY, {
        host: 'https://segment.test',
      });
      analytics.track(DUMMY_MESSAGE);
      await analytics.flush();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://segment.test/v1/batch',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /u),
          }),
        }),
      );
    });

    it('invokes callback with an error when the response is not ok and not retryable', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);
      const callback = jest.fn();
      analytics.track(DUMMY_MESSAGE, callback);
      await analytics.flush();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Bad Request' }),
        expect.any(Object),
      );
    });

    it('retries after a 500 response then succeeds on the next request', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Server Error',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);

      const callback = jest.fn();
      analytics.track(DUMMY_MESSAGE, callback);
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(undefined, expect.any(Object));
    });

    it('retries after a 429 response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);

      analytics.track(DUMMY_MESSAGE);
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('retries when fetch rejects with a retryable network error', async () => {
      const err = Object.assign(new Error('reset'), { code: 'ECONNRESET' });
      mockFetch.mockRejectedValueOnce(err).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      analytics.track(DUMMY_MESSAGE);
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('invokes callback with error when fetch rejects and the error is not retryable', async () => {
      mockFetch.mockRejectedValue(
        Object.assign(new Error('aborted'), { code: 'ECONNABORTED' }),
      );
      const callback = jest.fn();
      analytics.track(DUMMY_MESSAGE, callback);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'aborted' }),
        expect.any(Object),
      );
    });
  });

  describe('max queue size', () => {
    it('flushes when estimated queue JSON size reaches the limit', async () => {
      analytics = new Analytics(DUMMY_KEY, { flushAt: 100_000 });
      const pad = 'z'.repeat(24_000);
      const payload = { ...DUMMY_MESSAGE, event: 'Large payload', pad };
      analytics.track({ ...DUMMY_MESSAGE, event: 'bootstrap' });
      for (let i = 0; i < 25; i++) {
        analytics.track(payload);
      }
      await analytics.flush();
      expect(analytics.queue).toHaveLength(0);
    });
  });

  describe('#track', function () {
    it('adds messages to queue', function () {
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE);
      expect(analytics.queue).toHaveLength(1);
    });
  });

  describe('#page', function () {
    it('adds messages to queue', function () {
      analytics.page(DUMMY_MESSAGE);
      analytics.page(DUMMY_MESSAGE);
      expect(analytics.queue).toHaveLength(1);
    });
  });

  describe('#identify', function () {
    it('adds messages to queue', function () {
      analytics.identify(DUMMY_MESSAGE);
      analytics.identify(DUMMY_MESSAGE);
      expect(analytics.queue).toHaveLength(1);
    });
  });
});
