import { createPerpsInfrastructure } from './infrastructure';

describe('createPerpsInfrastructure', () => {
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
    expect(infrastructure.diskCache).toBeDefined();
    expect(infrastructure.rewards).toBeDefined();
  });

  describe('featureFlags', () => {
    it('validateVersionGated returns true as default stub', () => {
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
      expect(formatted).toContain('+2.50');
      expect(formatted).toContain('%');
    });

    it('exposes shared universal price ranges', () => {
      const { marketDataFormatters } = createPerpsInfrastructure();
      expect(marketDataFormatters.priceRangesUniversal.length).toBeGreaterThan(
        0,
      );
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
    it('invalidate does not throw', () => {
      const infrastructure = createPerpsInfrastructure();
      expect(() =>
        infrastructure.cacheInvalidator.invalidate({
          cacheType: 'positions',
        }),
      ).not.toThrow();
    });

    it('invalidateAll does not throw', () => {
      const infrastructure = createPerpsInfrastructure();
      expect(() =>
        infrastructure.cacheInvalidator.invalidateAll(),
      ).not.toThrow();
    });
  });

  describe('diskCache', () => {
    it('supports sync and async cache access', async () => {
      const { diskCache } = createPerpsInfrastructure();

      expect(diskCache.getItemSync('missing-key')).toBeNull();

      await diskCache.setItem('perps-test-key', 'value');

      expect(diskCache.getItemSync('perps-test-key')).toBe('value');
      await expect(diskCache.getItem('perps-test-key')).resolves.toBe('value');

      await diskCache.removeItem('perps-test-key');
      expect(diskCache.getItemSync('perps-test-key')).toBeNull();
    });
  });
});
