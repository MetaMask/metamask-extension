import {
  estimateLiquidationPrice,
  liquidationDistancePercent,
  maintenanceMarginRateFromMaxLeverage,
  safeDenominator,
  MARGIN_ADJUSTMENT_CONFIG,
} from './marginUtils';

describe('marginUtils (mobile parity)', () => {
  describe('safeDenominator', () => {
    it('replaces near-zero values with epsilon', () => {
      expect(safeDenominator(0)).toBe(1e-12);
      expect(safeDenominator(1e-13)).toBe(1e-12);
    });
  });

  describe('maintenanceMarginRateFromMaxLeverage', () => {
    it('returns 1 / maxLeverage', () => {
      expect(maintenanceMarginRateFromMaxLeverage(20)).toBe(0.05);
    });

    it('uses fallback when leverage is invalid', () => {
      expect(maintenanceMarginRateFromMaxLeverage(0)).toBe(
        1 / MARGIN_ADJUSTMENT_CONFIG.FallbackMaxLeverage,
      );
    });
  });

  describe('liquidationDistancePercent', () => {
    it('returns 20% when mark is 100000 and liq is 80000', () => {
      expect(liquidationDistancePercent(100000, 80000)).toBe(20);
    });

    it('returns 0 when mark is 0', () => {
      expect(liquidationDistancePercent(0, 80000)).toBe(0);
    });

    it('returns 0 when liq is null or 0', () => {
      expect(liquidationDistancePercent(100000, null)).toBe(0);
      expect(liquidationDistancePercent(100000, 0)).toBe(0);
    });
  });

  describe('estimateLiquidationPrice', () => {
    const base = {
      anchorLiquidationPrice: 2400,
      currentMargin: 2000,
      positionSize: 2,
      maxLeverage: 20,
    };

    it('returns anchor when newMargin is 0', () => {
      expect(
        estimateLiquidationPrice({
          ...base,
          newMargin: 0,
          isLong: true,
        }),
      ).toBe(2400);
    });

    it('returns anchor when positionSize is 0', () => {
      expect(
        estimateLiquidationPrice({
          ...base,
          newMargin: 2000,
          positionSize: 0,
          isLong: true,
        }),
      ).toBe(2400);
    });

    it('returns anchor when margin delta is 0', () => {
      expect(
        estimateLiquidationPrice({
          ...base,
          newMargin: 2000,
          isLong: true,
        }),
      ).toBe(2400);
    });

    it('moves long estimated liq down when margin increases (safer direction)', () => {
      const atAnchor = estimateLiquidationPrice({
        ...base,
        newMargin: 2000,
        isLong: true,
      });
      const added = estimateLiquidationPrice({
        ...base,
        newMargin: 2500,
        isLong: true,
      });
      expect(added).toBeLessThan(atAnchor);
    });

    it('moves short estimated liq up when margin increases', () => {
      const atAnchor = estimateLiquidationPrice({
        anchorLiquidationPrice: 2600,
        currentMargin: 2000,
        newMargin: 2000,
        positionSize: 2,
        isLong: false,
        maxLeverage: 20,
      });
      const added = estimateLiquidationPrice({
        anchorLiquidationPrice: 2600,
        currentMargin: 2000,
        newMargin: 2500,
        positionSize: 2,
        isLong: false,
        maxLeverage: 20,
      });
      expect(added).toBeGreaterThan(atAnchor);
    });
  });
});
