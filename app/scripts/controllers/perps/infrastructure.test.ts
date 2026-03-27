import {
  PERPS_EVENT_PROPERTY,
  PerpsAnalyticsEvent,
} from '@metamask/perps-controller';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import {
  createPerpsInfrastructure,
  type InfrastructureDeps,
} from './infrastructure';

describe('createPerpsInfrastructure', () => {
  const mockTrackEvent = jest.fn();

  function getDeps(): InfrastructureDeps {
    return { trackEvent: mockTrackEvent };
  }

  beforeEach(() => {
    mockTrackEvent.mockClear();
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
        screen_type: 'market_list',
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: PerpsAnalyticsEvent.ScreenViewed,
        category: MetaMetricsEventCategory.Perps,
        properties: {
          screen_type: 'market_list',
          [PERPS_EVENT_PROPERTY.TIMESTAMP]: expect.any(Number),
        },
      });
    });

    it('reports metrics as enabled', () => {
      const infrastructure = createPerpsInfrastructure(getDeps());
      expect(infrastructure.metrics.isEnabled()).toBe(true);
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
    it('invalidate does not throw', () => {
      const infrastructure = createPerpsInfrastructure(getDeps());
      expect(() =>
        infrastructure.cacheInvalidator.invalidate({
          cacheType: 'positions',
        }),
      ).not.toThrow();
    });

    it('invalidateAll does not throw', () => {
      const infrastructure = createPerpsInfrastructure(getDeps());
      expect(() =>
        infrastructure.cacheInvalidator.invalidateAll(),
      ).not.toThrow();
    });
  });
});
