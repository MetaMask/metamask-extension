import {
  calculateTBT,
  getTBTRating,
  getLongTaskMetrics,
  getLongTaskMetricsWithTBT,
  resetLongTaskMetrics,
  setupLongTaskObserver,
  disconnectLongTaskObserver,
  reportLongTaskMetricsToSentry,
  exposeLongTaskMetricsForTesting,
} from './performance-observers';

describe('performance-observers', () => {
  beforeEach(() => {
    resetLongTaskMetrics();
    disconnectLongTaskObserver();
    jest.clearAllMocks();
  });

  describe('calculateTBT', () => {
    it('returns 0 for empty array', () => {
      expect(calculateTBT([])).toBe(0);
    });

    it('returns 0 when all tasks are under 50ms', () => {
      const tasks = [{ duration: 30 }, { duration: 40 }, { duration: 50 }];
      expect(calculateTBT(tasks)).toBe(0);
    });

    it('calculates TBT correctly for tasks over 50ms', () => {
      const tasks = [
        { duration: 80 }, // 80 - 50 = 30ms blocking
        { duration: 150 }, // 150 - 50 = 100ms blocking
        { duration: 40 }, // not a long task, excluded
        { duration: 200 }, // 200 - 50 = 150ms blocking
      ];
      // TBT = 30 + 100 + 150 = 280ms
      expect(calculateTBT(tasks)).toBe(280);
    });

    it('handles single long task', () => {
      const tasks = [{ duration: 100 }];
      expect(calculateTBT(tasks)).toBe(50);
    });
  });

  describe('getTBTRating', () => {
    it('returns "good" for TBT < 200ms', () => {
      expect(getTBTRating(0)).toBe('good');
      expect(getTBTRating(100)).toBe('good');
      expect(getTBTRating(199)).toBe('good');
    });

    it('returns "needs-improvement" for TBT 200-600ms', () => {
      expect(getTBTRating(200)).toBe('needs-improvement');
      expect(getTBTRating(400)).toBe('needs-improvement');
      expect(getTBTRating(599)).toBe('needs-improvement');
    });

    it('returns "poor" for TBT >= 600ms', () => {
      expect(getTBTRating(600)).toBe('poor');
      expect(getTBTRating(1000)).toBe('poor');
    });
  });

  describe('getLongTaskMetrics', () => {
    it('returns initial empty metrics', () => {
      const metrics = getLongTaskMetrics();
      expect(metrics).toEqual({
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        tasks: [],
      });
    });

    it('returns a copy of metrics (not the original)', () => {
      const metrics1 = getLongTaskMetrics();
      const metrics2 = getLongTaskMetrics();

      expect(metrics1).not.toBe(metrics2);
      expect(metrics1.tasks).not.toBe(metrics2.tasks);
    });

    it('resets metrics when reset=true is passed', () => {
      const metrics = getLongTaskMetrics(true);

      expect(metrics).toEqual({
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        tasks: [],
      });

      const afterReset = getLongTaskMetrics();
      expect(afterReset.count).toBe(0);
    });
  });

  describe('getLongTaskMetricsWithTBT', () => {
    it('includes TBT calculation', () => {
      const metrics = getLongTaskMetricsWithTBT();

      expect(metrics).toHaveProperty('tbt');
      expect(metrics).toHaveProperty('tbtRating');
      expect(metrics.tbt).toBe(0);
      expect(metrics.tbtRating).toBe('good');
    });

    it('resets metrics when reset=true is passed', () => {
      const metrics = getLongTaskMetricsWithTBT(true);

      expect(metrics.tbt).toBe(0);

      const afterReset = getLongTaskMetrics();
      expect(afterReset.count).toBe(0);
    });
  });

  describe('resetLongTaskMetrics', () => {
    it('resets metrics to initial state', () => {
      resetLongTaskMetrics();
      const metrics = getLongTaskMetrics();

      expect(metrics.count).toBe(0);
      expect(metrics.totalDuration).toBe(0);
      expect(metrics.maxDuration).toBe(0);
      expect(metrics.tasks).toEqual([]);
    });
  });

  describe('setupLongTaskObserver', () => {
    const originalPerformanceObserver = globalThis.PerformanceObserver;
    const originalRandom = Math.random;

    afterEach(() => {
      globalThis.PerformanceObserver =
        originalPerformanceObserver as typeof PerformanceObserver;
      Math.random = originalRandom;
    });

    it('returns cleanup function', () => {
      Math.random = () => 0; // Always sample
      const cleanup = setupLongTaskObserver(1);
      expect(typeof cleanup).toBe('function');
    });

    it('does not setup observer when not sampled', () => {
      Math.random = () => 0.5; // 50% > 10% sample rate
      const cleanup = setupLongTaskObserver(0.1);

      // Should return no-op cleanup
      expect(typeof cleanup).toBe('function');
    });

    it('handles missing PerformanceObserver gracefully', () => {
      Math.random = () => 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).PerformanceObserver;

      const cleanup = setupLongTaskObserver(1);

      // Should return no-op cleanup without throwing
      expect(typeof cleanup).toBe('function');
    });

    it('accumulates metrics when observer callback fires', () => {
      Math.random = () => 0;
      let capturedCallback: (list: { getEntries: () => object[] }) => void;

      const mockObserve = jest.fn();
      const mockDisconnect = jest.fn();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).PerformanceObserver = class {
        constructor(
          callback: (list: { getEntries: () => object[] }) => void,
        ) {
          capturedCallback = callback;
        }

        observe = mockObserve;

        disconnect = mockDisconnect;
      };

      setupLongTaskObserver(1);

      capturedCallback!({
        getEntries: () => [
          { name: 'self', duration: 120, startTime: 100 },
          { name: 'self', duration: 80, startTime: 300 },
        ],
      });

      const metrics = getLongTaskMetrics();
      expect(metrics.count).toBe(2);
      expect(metrics.totalDuration).toBe(200);
      expect(metrics.maxDuration).toBe(120);
      expect(metrics.tasks).toHaveLength(2);
    });

    it('returns disconnect cleanup for duplicate observer calls', () => {
      Math.random = () => 0;
      const mockObserve = jest.fn();
      const mockDisconnect = jest.fn();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).PerformanceObserver = class {
        observe = mockObserve;

        disconnect = mockDisconnect;
      };

      setupLongTaskObserver(1);
      const cleanup2 = setupLongTaskObserver(1);

      // Second call should still return a valid cleanup
      expect(typeof cleanup2).toBe('function');
      // observe should only have been called once (first setup)
      expect(mockObserve).toHaveBeenCalledTimes(1);
    });

    it('handles observer.observe throwing an error', () => {
      Math.random = () => 0;
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).PerformanceObserver = class {
        observe() {
          throw new Error('longtask not supported');
        }

        disconnect = jest.fn();
      };

      const cleanup = setupLongTaskObserver(1);
      expect(typeof cleanup).toBe('function');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Performance] Failed to setup Long Task observer:',
        expect.any(Error),
      );

      consoleWarnSpy.mockRestore();
    });

    it('caps stored tasks at MAX_TASKS_STORED (50)', () => {
      Math.random = () => 0;
      let capturedCallback: (list: { getEntries: () => object[] }) => void;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).PerformanceObserver = class {
        constructor(
          callback: (list: { getEntries: () => object[] }) => void,
        ) {
          capturedCallback = callback;
        }

        observe = jest.fn();

        disconnect = jest.fn();
      };

      setupLongTaskObserver(1);

      const entries = Array.from({ length: 60 }, (_, i) => ({
        name: 'self',
        duration: 60 + i,
        startTime: i * 100,
      }));

      capturedCallback!({ getEntries: () => entries });

      const metrics = getLongTaskMetrics();
      expect(metrics.count).toBe(60);
      expect(metrics.tasks).toHaveLength(50);
    });

    it('disconnects observer on cleanup', () => {
      Math.random = () => 0;
      const mockDisconnect = jest.fn();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).PerformanceObserver = class {
        observe = jest.fn();

        disconnect = mockDisconnect;
      };

      const cleanup = setupLongTaskObserver(1);
      cleanup();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('reportLongTaskMetricsToSentry', () => {
    const originalSentry = globalThis.sentry;

    afterEach(() => {
      globalThis.sentry = originalSentry;
    });

    it('does nothing when Sentry is not available', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).sentry;

      // Should not throw
      expect(() => reportLongTaskMetricsToSentry()).not.toThrow();
    });

    it('reports metrics to Sentry when available', () => {
      const mockSentry = {
        setMeasurement: jest.fn(),
        setTag: jest.fn(),
        addBreadcrumb: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).sentry = mockSentry;

      reportLongTaskMetricsToSentry();

      expect(mockSentry.setMeasurement).toHaveBeenCalledWith(
        'long_task_count',
        0,
        'none',
      );
      expect(mockSentry.setMeasurement).toHaveBeenCalledWith(
        'tbt',
        0,
        'millisecond',
      );
      expect(mockSentry.setTag).toHaveBeenCalledWith('tbt.rating', 'good');
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance',
          level: 'info',
        }),
      );
    });

    it('reports provided metrics instead of current metrics', () => {
      const mockSentry = {
        setMeasurement: jest.fn(),
        setTag: jest.fn(),
        addBreadcrumb: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).sentry = mockSentry;

      const customMetrics = {
        count: 5,
        totalDuration: 500,
        maxDuration: 200,
        tasks: [{ name: 'test', duration: 200, startTime: 0 }],
        tbt: 150,
        tbtRating: 'good' as const,
      };

      reportLongTaskMetricsToSentry(customMetrics);

      expect(mockSentry.setMeasurement).toHaveBeenCalledWith(
        'long_task_count',
        5,
        'none',
      );
      expect(mockSentry.setMeasurement).toHaveBeenCalledWith(
        'tbt',
        150,
        'millisecond',
      );
    });

    function expectBucket(count: number, expected: string) {
      const mockSentry = {
        setMeasurement: jest.fn(),
        setTag: jest.fn(),
        addBreadcrumb: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).sentry = mockSentry;

      reportLongTaskMetricsToSentry({
        count,
        totalDuration: 0,
        maxDuration: 0,
        tasks: [],
        tbt: 0,
        tbtRating: 'good',
      });

      expect(mockSentry.setTag).toHaveBeenCalledWith(
        'long_task.count_bucket',
        expected,
      );
    }

    it('bucketizes count 0 as "0"', () => expectBucket(0, '0'));
    it('bucketizes count 1 as "1-5"', () => expectBucket(1, '1-5'));
    it('bucketizes count 5 as "1-5"', () => expectBucket(5, '1-5'));
    it('bucketizes count 6 as "6-10"', () => expectBucket(6, '6-10'));
    it('bucketizes count 10 as "6-10"', () => expectBucket(10, '6-10'));
    it('bucketizes count 11 as "11-25"', () => expectBucket(11, '11-25'));
    it('bucketizes count 25 as "11-25"', () => expectBucket(25, '11-25'));
    it('bucketizes count 26 as "26-50"', () => expectBucket(26, '26-50'));
    it('bucketizes count 50 as "26-50"', () => expectBucket(50, '26-50'));
    it('bucketizes count 51 as "50+"', () => expectBucket(51, '50+'));
    it('bucketizes count 100 as "50+"', () => expectBucket(100, '50+'));
  });

  describe('exposeLongTaskMetricsForTesting', () => {
    const originalStateHooks = globalThis.stateHooks;
    const originalInTest = process.env.IN_TEST;

    afterEach(() => {
      globalThis.stateHooks = originalStateHooks;
      process.env.IN_TEST = originalInTest;
    });

    it('exposes metrics functions on stateHooks when IN_TEST is set', () => {
      process.env.IN_TEST = 'true';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).stateHooks = {};

      exposeLongTaskMetricsForTesting();

      expect(globalThis.stateHooks.getLongTaskMetrics).toBe(getLongTaskMetrics);
      expect(globalThis.stateHooks.getLongTaskMetricsWithTBT).toBe(
        getLongTaskMetricsWithTBT,
      );
      expect(globalThis.stateHooks.resetLongTaskMetrics).toBe(
        resetLongTaskMetrics,
      );
    });

    it('does not expose when stateHooks is not available', () => {
      process.env.IN_TEST = 'true';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).stateHooks;

      // Should not throw
      expect(() => exposeLongTaskMetricsForTesting()).not.toThrow();
    });

    it('does not expose when not in test mode', () => {
      delete process.env.IN_TEST;
      delete process.env.METAMASK_DEBUG;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).stateHooks = {};

      exposeLongTaskMetricsForTesting();

      expect(globalThis.stateHooks.getLongTaskMetrics).toBeUndefined();
    });
  });
});
