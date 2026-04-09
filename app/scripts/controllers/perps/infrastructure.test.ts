import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
  PerpsAnalyticsEvent,
} from '../../../../shared/constants/perps-events';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import {
  createPerpsInfrastructure,
  type InfrastructureDeps,
} from './infrastructure';

const mockCaptureException = jest.fn();
jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}));

function setupSentryScope() {
  const mockScope = {
    setTag: jest.fn(),
    setContext: jest.fn(),
    setExtras: jest.fn(),
  };
  const withScope = jest.fn((cb: (scope: typeof mockScope) => void) =>
    cb(mockScope),
  );
  (globalThis as Record<string, unknown>).sentry = { withScope };
  return mockScope;
}

describe('createPerpsInfrastructure', () => {
  const mockTrackEvent = jest.fn();

  function getDeps(): InfrastructureDeps {
    return { trackEvent: mockTrackEvent };
  }

  beforeEach(() => {
    mockTrackEvent.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as Record<string, unknown>).sentry;
  });

  it('returns a valid PerpsPlatformDependencies object', () => {
    const infrastructure = createPerpsInfrastructure(getDeps());

    expect(infrastructure.logger).toBeDefined();
    expect(infrastructure.debugLogger).toBeDefined();
    expect(infrastructure.metrics).toBeDefined();
    expect(infrastructure.performance).toBeDefined();
    expect(infrastructure.tracer).toBeDefined();
    expect(infrastructure.streamManager).toBeDefined();
    expect(infrastructure.featureFlags).toBeDefined();
    expect(infrastructure.marketDataFormatters).toBeDefined();
    expect(infrastructure.cacheInvalidator).toBeDefined();
    expect(infrastructure.rewards).toBeDefined();
  });

  describe('metrics', () => {
    it('trackPerpsEvent forwards to trackEvent with Perps category and timestamp', () => {
      const infrastructure = createPerpsInfrastructure(getDeps());

      infrastructure.metrics.trackPerpsEvent(PerpsAnalyticsEvent.ScreenViewed, {
        [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
          PERPS_EVENT_VALUE.SCREEN_TYPE.MARKET_LIST,
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: PerpsAnalyticsEvent.ScreenViewed,
        category: MetaMetricsEventCategory.Perps,
        properties: {
          [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
            PERPS_EVENT_VALUE.SCREEN_TYPE.MARKET_LIST,
          [PERPS_EVENT_PROPERTY.TIMESTAMP]: expect.any(Number),
        },
      });
    });

    it('reports metrics as enabled', () => {
      const infrastructure = createPerpsInfrastructure(getDeps());
      expect(infrastructure.metrics.isEnabled()).toBe(true);
    });
  });

  describe('logger', () => {
    describe('when sentry.withScope is not available', () => {
      it('falls back to captureException without scope', () => {
        const { logger } = createPerpsInfrastructure(getDeps());
        const error = new Error('test error');

        logger.error(error);

        expect(mockCaptureException).toHaveBeenCalledWith(error);
      });

      it('does not throw when options are provided but withScope is unavailable', () => {
        const { logger } = createPerpsInfrastructure(getDeps());
        const error = new Error('test error');

        expect(() =>
          logger.error(error, {
            tags: { provider: 'hyperliquid' },
            context: {
              name: 'PerpsController',
              data: { method: 'placeOrder' },
            },
            extras: { orderId: '123' },
          }),
        ).not.toThrow();
      });
    });

    describe('when sentry.withScope is available', () => {
      it('always sets the feature:perps tag', () => {
        const mockScope = setupSentryScope();

        const { logger } = createPerpsInfrastructure(getDeps());
        logger.error(new Error('test'));

        expect(mockScope.setTag).toHaveBeenCalledWith('feature', 'perps');
      });

      it('forwards errors to captureException inside the scope', () => {
        setupSentryScope();

        const { logger } = createPerpsInfrastructure(getDeps());
        const error = new Error('test error');
        logger.error(error);

        expect(mockCaptureException).toHaveBeenCalledWith(error);
      });

      it('sets extra tags from options on the scope', () => {
        const mockScope = setupSentryScope();

        const { logger } = createPerpsInfrastructure(getDeps());
        logger.error(new Error('test'), {
          tags: { provider: 'hyperliquid', network: 'mainnet' },
        });

        expect(mockScope.setTag).toHaveBeenCalledWith(
          'provider',
          'hyperliquid',
        );
        expect(mockScope.setTag).toHaveBeenCalledWith('network', 'mainnet');
      });

      it('converts numeric tag values to strings', () => {
        const mockScope = setupSentryScope();

        const { logger } = createPerpsInfrastructure(getDeps());
        logger.error(new Error('test'), { tags: { retryCount: 3 } });

        expect(mockScope.setTag).toHaveBeenCalledWith('retryCount', '3');
      });

      it('sets Sentry context from options', () => {
        const mockScope = setupSentryScope();

        const { logger } = createPerpsInfrastructure(getDeps());
        logger.error(new Error('test'), {
          context: {
            name: 'PerpsController',
            data: { method: 'placeOrder', orderId: 'abc123' },
          },
        });

        expect(mockScope.setContext).toHaveBeenCalledWith('PerpsController', {
          method: 'placeOrder',
          orderId: 'abc123',
        });
      });

      it('sets Sentry extras from options', () => {
        const mockScope = setupSentryScope();

        const { logger } = createPerpsInfrastructure(getDeps());
        logger.error(new Error('test'), {
          extras: { requestPayload: '{"coin":"ETH"}' },
        });

        expect(mockScope.setExtras).toHaveBeenCalledWith({
          requestPayload: '{"coin":"ETH"}',
        });
      });

      it('works correctly when options are omitted', () => {
        const mockScope = setupSentryScope();

        const { logger } = createPerpsInfrastructure(getDeps());
        const error = new Error('bare error');
        logger.error(error);

        expect(mockScope.setTag).toHaveBeenCalledWith('feature', 'perps');
        expect(mockScope.setContext).not.toHaveBeenCalled();
        expect(mockScope.setExtras).not.toHaveBeenCalled();
        expect(mockCaptureException).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('performance', () => {
    it('returns a numeric timestamp', () => {
      const { performance: perf } = createPerpsInfrastructure(getDeps());

      expect(typeof perf.now()).toBe('number');
    });
  });

  describe('tracer', () => {
    describe('when sentry is not available', () => {
      it('does not throw on trace', () => {
        const { tracer } = createPerpsInfrastructure(getDeps());

        expect(() =>
          tracer.trace({
            name: 'Perps Place Order' as never,
            id: '1',
            op: 'perps.order',
          }),
        ).not.toThrow();
      });

      it('does not throw on endTrace', () => {
        const { tracer } = createPerpsInfrastructure(getDeps());

        expect(() =>
          tracer.endTrace({ name: 'Perps Place Order' as never, id: '1' }),
        ).not.toThrow();
      });

      it('does not throw on setMeasurement', () => {
        const { tracer } = createPerpsInfrastructure(getDeps());

        expect(() =>
          tracer.setMeasurement('test', 100, 'millisecond'),
        ).not.toThrow();
      });
    });

    describe('when sentry is available', () => {
      it('calls startSpanManual on trace', () => {
        const mockSpan = { setAttribute: jest.fn(), end: jest.fn() };
        const startSpanManual = jest.fn((_opts, cb) => cb(mockSpan));
        (globalThis as Record<string, unknown>).sentry = { startSpanManual };

        const { tracer } = createPerpsInfrastructure(getDeps());
        tracer.trace({
          name: 'Perps Place Order' as never,
          id: 'abc',
          op: 'perps.order',
          data: { coin: 'ETH' },
        });

        expect(startSpanManual).toHaveBeenCalledWith(
          {
            name: 'Perps Place Order',
            op: 'perps.order',
            attributes: { coin: 'ETH' },
          },
          expect.any(Function),
        );
      });

      it('merges tags and data into span attributes', () => {
        const mockSpan = { setAttribute: jest.fn(), end: jest.fn() };
        const startSpanManual = jest.fn((_opts, cb) => cb(mockSpan));
        (globalThis as Record<string, unknown>).sentry = { startSpanManual };

        const { tracer } = createPerpsInfrastructure(getDeps());
        tracer.trace({
          name: 'Perps Place Order' as never,
          id: 'abc',
          op: 'perps.order',
          tags: { network: 'arbitrum' },
          data: { coin: 'ETH' },
        });

        expect(startSpanManual).toHaveBeenCalledWith(
          {
            name: 'Perps Place Order',
            op: 'perps.order',
            attributes: { network: 'arbitrum', coin: 'ETH' },
          },
          expect.any(Function),
        );
      });

      it('ends the span on endTrace', () => {
        const mockSpan = { setAttribute: jest.fn(), end: jest.fn() };
        const startSpanManual = jest.fn((_opts, cb) => cb(mockSpan));
        (globalThis as Record<string, unknown>).sentry = { startSpanManual };

        const { tracer } = createPerpsInfrastructure(getDeps());
        tracer.trace({
          name: 'Perps Place Order' as never,
          id: 'abc',
          op: 'perps.order',
        });

        tracer.endTrace({ name: 'Perps Place Order' as never, id: 'abc' });

        expect(mockSpan.end).toHaveBeenCalled();
      });

      it('does nothing on endTrace for unknown span', () => {
        (globalThis as Record<string, unknown>).sentry = {
          startSpanManual: jest.fn(),
        };
        const { tracer } = createPerpsInfrastructure(getDeps());

        expect(() =>
          tracer.endTrace({ name: 'Perps Place Order' as never, id: 'nope' }),
        ).not.toThrow();
      });

      it('sets attributes from data before ending the span', () => {
        const mockSpan = { setAttribute: jest.fn(), end: jest.fn() };
        const startSpanManual = jest.fn((_opts, cb) => cb(mockSpan));
        (globalThis as Record<string, unknown>).sentry = { startSpanManual };

        const { tracer } = createPerpsInfrastructure(getDeps());
        tracer.trace({
          name: 'Perps Place Order' as never,
          id: 'abc',
          op: 'perps.order',
        });

        tracer.endTrace({
          name: 'Perps Place Order' as never,
          id: 'abc',
          data: { result: 'success', latency: 42 },
        });

        expect(mockSpan.setAttribute).toHaveBeenCalledWith('result', 'success');
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('latency', 42);
        expect(mockSpan.end).toHaveBeenCalled();
      });

      it('removes the span after endTrace', () => {
        const mockSpan = { setAttribute: jest.fn(), end: jest.fn() };
        const startSpanManual = jest.fn((_opts, cb) => cb(mockSpan));
        (globalThis as Record<string, unknown>).sentry = { startSpanManual };

        const { tracer } = createPerpsInfrastructure(getDeps());
        tracer.trace({
          name: 'Perps Place Order' as never,
          id: 'abc',
          op: 'perps.order',
        });
        tracer.endTrace({ name: 'Perps Place Order' as never, id: 'abc' });

        // Second endTrace is a no-op — span.end not called again
        tracer.endTrace({ name: 'Perps Place Order' as never, id: 'abc' });

        expect(mockSpan.end).toHaveBeenCalledTimes(1);
      });

      it('ends the previous span when trace is called with a duplicate key', () => {
        const firstSpan = { setAttribute: jest.fn(), end: jest.fn() };
        const secondSpan = { setAttribute: jest.fn(), end: jest.fn() };
        let callCount = 0;
        const startSpanManual = jest.fn((_opts, cb) => {
          cb(callCount === 0 ? firstSpan : secondSpan);
          callCount += 1;
        });
        (globalThis as Record<string, unknown>).sentry = { startSpanManual };

        const { tracer } = createPerpsInfrastructure(getDeps());
        tracer.trace({
          name: 'Perps Place Order' as never,
          id: 'dup',
          op: 'perps.order',
        });
        tracer.trace({
          name: 'Perps Place Order' as never,
          id: 'dup',
          op: 'perps.order',
        });

        expect(firstSpan.end).toHaveBeenCalledTimes(1);
      });

      it('evicts the oldest span when the pending map reaches capacity', () => {
        const spans: { setAttribute: jest.Mock; end: jest.Mock }[] = [];
        const startSpanManual = jest.fn((_opts, cb) => {
          const span = { setAttribute: jest.fn(), end: jest.fn() };
          spans.push(span);
          cb(span);
        });
        (globalThis as Record<string, unknown>).sentry = { startSpanManual };

        const { tracer } = createPerpsInfrastructure(getDeps());

        // Fill the map to capacity (MAX_PENDING_SPANS = 50)
        for (let i = 0; i < 50; i++) {
          tracer.trace({
            name: 'Perps Place Order' as never,
            id: String(i),
            op: 'perps.order',
          });
        }

        // The first span should still be pending — map is exactly at capacity
        expect(spans[0].end).not.toHaveBeenCalled();

        // One more trace pushes the map over capacity, evicting span[0]
        tracer.trace({
          name: 'Perps Place Order' as never,
          id: '50',
          op: 'perps.order',
        });

        expect(spans[0].end).toHaveBeenCalledTimes(1);
      });

      it('calls setMeasurement on sentry', () => {
        const setMeasurement = jest.fn();
        (globalThis as Record<string, unknown>).sentry = { setMeasurement };

        const { tracer } = createPerpsInfrastructure(getDeps());
        tracer.setMeasurement('perps.latency', 42, 'millisecond');

        expect(setMeasurement).toHaveBeenCalledWith(
          'perps.latency',
          42,
          'millisecond',
        );
      });
    });
  });

  describe('streamManager', () => {
    it('does not throw on pauseChannel', () => {
      const { streamManager } = createPerpsInfrastructure(getDeps());

      expect(() => streamManager.pauseChannel('test')).not.toThrow();
    });

    it('does not throw on resumeChannel', () => {
      const { streamManager } = createPerpsInfrastructure(getDeps());

      expect(() => streamManager.resumeChannel('test')).not.toThrow();
    });

    it('does not throw on clearAllChannels', () => {
      const { streamManager } = createPerpsInfrastructure(getDeps());

      expect(() => streamManager.clearAllChannels()).not.toThrow();
    });
  });

  describe('featureFlags', () => {
    it('validateVersionGated returns true as default stub', () => {
      const infrastructure = createPerpsInfrastructure(getDeps());
      const result = infrastructure.featureFlags.validateVersionGated({
        enabled: true,
        minimumVersion: '1.0.0',
      });
      expect(result).toBe(true);
    });
  });

  describe('marketDataFormatters', () => {
    it('formats volume as compact USD', () => {
      const { marketDataFormatters } = createPerpsInfrastructure(getDeps());
      const formatted = marketDataFormatters.formatVolume(1_200_000_000);
      expect(formatted).toContain('1.2');
      expect(formatted).toContain('B');
    });

    it('formats fiat as USD with 2 decimals', () => {
      const { marketDataFormatters } = createPerpsInfrastructure(getDeps());
      const formatted = marketDataFormatters.formatPerpsFiat(50000.123);
      expect(formatted).toContain('50,000.12');
    });

    it('formats percentage', () => {
      const { marketDataFormatters } = createPerpsInfrastructure(getDeps());
      const formatted = marketDataFormatters.formatPercentage(2.5);
      expect(formatted).toContain('2.50');
      expect(formatted).toContain('%');
    });
  });

  describe('rewards', () => {
    it('returns 0 discount as default stub', async () => {
      const infrastructure = createPerpsInfrastructure(getDeps());
      const discount = await infrastructure.rewards.getPerpsDiscountForAccount(
        'eip155:42161:0x1234',
      );
      expect(discount).toBe(0);
    });
  });

  describe('cacheInvalidator', () => {
    it('does not throw on invalidate', () => {
      const infrastructure = createPerpsInfrastructure(getDeps());
      expect(() =>
        infrastructure.cacheInvalidator.invalidate({
          cacheType: 'positions',
        }),
      ).not.toThrow();
    });

    it('does not throw on invalidateAll', () => {
      const infrastructure = createPerpsInfrastructure(getDeps());
      expect(() =>
        infrastructure.cacheInvalidator.invalidateAll(),
      ).not.toThrow();
    });
  });
});
