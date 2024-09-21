import Analytics from './analytics';

const DUMMY_KEY = 'DUMMY_KEY';
const DUMMY_MESSAGE = {
  userId: 'userId',
  idValue: 'idValue',
  event: 'event',
};
const FLUSH_INTERVAL = 10000;

global.setImmediate = (arg) => {
  arg();
};

global.fetch = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  });

describe('Analytics', function () {
  let analytics;

  beforeEach(() => {
    analytics = new Analytics(DUMMY_KEY);
  });

  describe('#flush', function () {
    it('first message is immediately flushed', function () {
      const mock = jest.fn(analytics.flush);
      analytics.flush = mock;
      analytics.track(DUMMY_MESSAGE);
      expect(analytics.queue).toHaveLength(0);
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it('after first message it is called when queue size equals flushAt value', function () {
      analytics = new Analytics(DUMMY_KEY, { flushAt: 3 });
      const mock = jest.fn(analytics.flush);
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
      const mock = jest.fn(analytics.flush);
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
      const mock = jest.fn(analytics.flush);
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
      const mock = jest.fn(analytics.flush);
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
  });

  describe('#track', function () {
    it('adds messages to ququq', function () {
      analytics.track(DUMMY_MESSAGE);
      analytics.track(DUMMY_MESSAGE);
      expect(analytics.queue).toHaveLength(1);
    });
  });

  describe('#page', function () {
    it('adds messages to ququq', function () {
      analytics.page(DUMMY_MESSAGE);
      analytics.page(DUMMY_MESSAGE);
      expect(analytics.queue).toHaveLength(1);
    });
  });

  describe('#identify', function () {
    it('adds messages to ququq', function () {
      analytics.identify(DUMMY_MESSAGE);
      analytics.identify(DUMMY_MESSAGE);
      expect(analytics.queue).toHaveLength(1);
    });
  });
});
