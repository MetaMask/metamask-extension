import { createPerpsInfrastructure } from './infrastructure';

const mockCaptureException = jest.fn();
jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}));

describe('createPerpsInfrastructure', () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as Record<string, unknown>).sentry;
  });

  it('returns a valid PerpsPlatformDependencies object', () => {
    const infrastructure = createPerpsInfrastructure();

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

  describe('logger', () => {
    it('forwards errors to captureException', () => {
      const { logger } = createPerpsInfrastructure();
      const error = new Error('test error');

      logger.error(error);

      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });
  });

  describe('metrics', () => {
    it('reports metrics as disabled', () => {
      const { metrics } = createPerpsInfrastructure();

      expect(metrics.isEnabled()).toBe(false);
    });

    it('does not throw when tracking an event', () => {
      const { metrics } = createPerpsInfrastructure();

      expect(() =>
        metrics.trackPerpsEvent('test_event' as never, {} as never),
      ).not.toThrow();
    });
  });

  describe('performance', () => {
    it('returns a numeric timestamp', () => {
      const { performance: perf } = createPerpsInfrastructure();

      expect(typeof perf.now()).toBe('number');
    });
  });

  describe('tracer', () => {
    describe('when sentry is not available', () => {
      it('does not throw on trace', () => {
        const { tracer } = createPerpsInfrastructure();

        expect(() =>
          tracer.trace({
            name: 'Perps Place Order' as never,
            id: '1',
            op: 'perps.order',
          }),
        ).not.toThrow();
      });

      it('does not throw on endTrace', () => {
        const { tracer } = createPerpsInfrastructure();

        expect(() =>
          tracer.endTrace({ name: 'Perps Place Order' as never, id: '1' }),
        ).not.toThrow();
      });

      it('does not throw on setMeasurement', () => {
        const { tracer } = createPerpsInfrastructure();

        expect(() =>
          tracer.setMeasurement('test', 100, 'millisecond'),
        ).not.toThrow();
      });

      it('does not throw on addBreadcrumb', () => {
        const { tracer } = createPerpsInfrastructure();

        expect(() =>
          tracer.addBreadcrumb({
            category: 'perps',
            message: 'test',
            level: 'info',
          }),
        ).not.toThrow();
      });
    });

    describe('when sentry is available', () => {
      it('calls startSpanManual on trace', () => {
        const mockSpan = { setAttribute: jest.fn(), end: jest.fn() };
        const startSpanManual = jest.fn((_opts, cb) => cb(mockSpan));
        (globalThis as Record<string, unknown>).sentry = { startSpanManual };

        const { tracer } = createPerpsInfrastructure();
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

        const { tracer } = createPerpsInfrastructure();
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

        const { tracer } = createPerpsInfrastructure();
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
        const { tracer } = createPerpsInfrastructure();

        expect(() =>
          tracer.endTrace({ name: 'Perps Place Order' as never, id: 'nope' }),
        ).not.toThrow();
      });

      it('sets attributes from data before ending the span', () => {
        const mockSpan = { setAttribute: jest.fn(), end: jest.fn() };
        const startSpanManual = jest.fn((_opts, cb) => cb(mockSpan));
        (globalThis as Record<string, unknown>).sentry = { startSpanManual };

        const { tracer } = createPerpsInfrastructure();
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

        expect(mockSpan.setAttribute).toHaveBeenCalledWith(
          'result',
          'success',
        );
        expect(mockSpan.setAttribute).toHaveBeenCalledWith('latency', 42);
        expect(mockSpan.end).toHaveBeenCalled();
      });

      it('removes the span after endTrace', () => {
        const mockSpan = { setAttribute: jest.fn(), end: jest.fn() };
        const startSpanManual = jest.fn((_opts, cb) => cb(mockSpan));
        (globalThis as Record<string, unknown>).sentry = { startSpanManual };

        const { tracer } = createPerpsInfrastructure();
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

      it('calls setMeasurement on sentry', () => {
        const setMeasurement = jest.fn();
        (globalThis as Record<string, unknown>).sentry = { setMeasurement };

        const { tracer } = createPerpsInfrastructure();
        tracer.setMeasurement('perps.latency', 42, 'millisecond');

        expect(setMeasurement).toHaveBeenCalledWith(
          'perps.latency',
          42,
          'millisecond',
        );
      });

      it('calls addBreadcrumb on sentry', () => {
        const addBreadcrumb = jest.fn();
        (globalThis as Record<string, unknown>).sentry = { addBreadcrumb };

        const { tracer } = createPerpsInfrastructure();
        tracer.addBreadcrumb({
          category: 'perps',
          message: 'order placed',
          level: 'info',
          data: { coin: 'ETH' },
        });

        expect(addBreadcrumb).toHaveBeenCalledWith({
          category: 'perps',
          message: 'order placed',
          level: 'info',
          data: { coin: 'ETH' },
        });
      });
    });
  });

  describe('streamManager', () => {
    it('does not throw on pauseChannel', () => {
      const { streamManager } = createPerpsInfrastructure();

      expect(() => streamManager.pauseChannel('test')).not.toThrow();
    });

    it('does not throw on resumeChannel', () => {
      const { streamManager } = createPerpsInfrastructure();

      expect(() => streamManager.resumeChannel('test')).not.toThrow();
    });

    it('does not throw on clearAllChannels', () => {
      const { streamManager } = createPerpsInfrastructure();

      expect(() => streamManager.clearAllChannels()).not.toThrow();
    });
  });

  describe('featureFlags', () => {
    it('validates a version-gated flag', () => {
      const infrastructure = createPerpsInfrastructure();
      const result = infrastructure.featureFlags.validateVersionGated({
        enabled: true,
        minimumVersion: '1.0.0',
      });
      expect(result).toBe(true);
    });
  });

  describe('marketDataFormatters', () => {
    it('formats volume as compact USD', () => {
      const { marketDataFormatters } = createPerpsInfrastructure();
      const formatted = marketDataFormatters.formatVolume(1_200_000_000);
      expect(formatted).toContain('1.2');
      expect(formatted).toContain('B');
    });

    it('formats fiat as USD with 2 decimals', () => {
      const { marketDataFormatters } = createPerpsInfrastructure();
      const formatted = marketDataFormatters.formatPerpsFiat(50000.123);
      expect(formatted).toContain('50,000.12');
    });

    it('formats percentage', () => {
      const { marketDataFormatters } = createPerpsInfrastructure();
      const formatted = marketDataFormatters.formatPercentage(2.5);
      expect(formatted).toContain('2.50');
      expect(formatted).toContain('%');
    });
  });

  describe('rewards', () => {
    it('returns 0 discount as default stub', async () => {
      const infrastructure = createPerpsInfrastructure();
      const discount = await infrastructure.rewards.getPerpsDiscountForAccount(
        'eip155:42161:0x1234',
      );
      expect(discount).toBe(0);
    });
  });

  describe('cacheInvalidator', () => {
    it('does not throw on invalidate', () => {
      const infrastructure = createPerpsInfrastructure();
      expect(() =>
        infrastructure.cacheInvalidator.invalidate({
          cacheType: 'positions',
        }),
      ).not.toThrow();
    });

    it('does not throw on invalidateAll', () => {
      const infrastructure = createPerpsInfrastructure();
      expect(() =>
        infrastructure.cacheInvalidator.invalidateAll(),
      ).not.toThrow();
    });
  });
});
