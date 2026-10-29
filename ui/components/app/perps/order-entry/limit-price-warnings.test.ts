import {
  parseLimitPrice,
  isLimitPriceUnfavorable,
  isNearLiquidationPrice,
} from './limit-price-warnings';

describe('parseLimitPrice', () => {
  it('parses a plain numeric string', () => {
    expect(parseLimitPrice('45000')).toBe(45000);
  });

  it('strips commas', () => {
    expect(parseLimitPrice('45,000.50')).toBe(45000.5);
  });

  it('strips dollar signs', () => {
    expect(parseLimitPrice('$45,000')).toBe(45000);
  });

  it('returns NaN for empty string', () => {
    expect(parseLimitPrice('')).toBeNaN();
  });

  it('returns NaN for non-numeric input', () => {
    expect(parseLimitPrice('abc')).toBeNaN();
  });
});

describe('isLimitPriceUnfavorable', () => {
  const CURRENT_PRICE = 45000;

  describe('long direction', () => {
    it('returns true when limit price is above current price', () => {
      expect(isLimitPriceUnfavorable('46000', CURRENT_PRICE, 'long')).toBe(
        true,
      );
    });

    it('returns false when limit price is below current price', () => {
      expect(isLimitPriceUnfavorable('44000', CURRENT_PRICE, 'long')).toBe(
        false,
      );
    });

    it('returns false when limit price equals current price', () => {
      expect(isLimitPriceUnfavorable('45000', CURRENT_PRICE, 'long')).toBe(
        false,
      );
    });
  });

  describe('short direction', () => {
    it('returns true when limit price is below current price', () => {
      expect(isLimitPriceUnfavorable('44000', CURRENT_PRICE, 'short')).toBe(
        true,
      );
    });

    it('returns false when limit price is above current price', () => {
      expect(isLimitPriceUnfavorable('46000', CURRENT_PRICE, 'short')).toBe(
        false,
      );
    });

    it('returns false when limit price equals current price', () => {
      expect(isLimitPriceUnfavorable('45000', CURRENT_PRICE, 'short')).toBe(
        false,
      );
    });
  });

  describe('edge cases', () => {
    it('returns false for empty limit price', () => {
      expect(isLimitPriceUnfavorable('', CURRENT_PRICE, 'long')).toBe(false);
    });

    it('returns false for zero limit price', () => {
      expect(isLimitPriceUnfavorable('0', CURRENT_PRICE, 'short')).toBe(false);
    });

    it('returns false when current price is zero', () => {
      expect(isLimitPriceUnfavorable('46000', 0, 'long')).toBe(false);
    });

    it('returns false when current price is negative', () => {
      expect(isLimitPriceUnfavorable('46000', -1, 'long')).toBe(false);
    });

    it('handles formatted prices with commas and dollar signs', () => {
      expect(isLimitPriceUnfavorable('$46,000.00', CURRENT_PRICE, 'long')).toBe(
        true,
      );
    });
  });
});

describe('isNearLiquidationPrice', () => {
  describe('long direction', () => {
    it('returns true when current price is at or below liquidation price', () => {
      expect(isNearLiquidationPrice(100, 200, 'long')).toBe(true);
    });

    it('returns true when current price equals liquidation price', () => {
      expect(isNearLiquidationPrice(200, 200, 'long')).toBe(true);
    });

    it('returns false when current price is safely above liquidation', () => {
      expect(isNearLiquidationPrice(45000, 40000, 'long')).toBe(false);
    });
  });

  describe('short direction', () => {
    it('returns true when current price is at or above liquidation price', () => {
      expect(isNearLiquidationPrice(500, 400, 'short')).toBe(true);
    });

    it('returns true when current price equals liquidation price', () => {
      expect(isNearLiquidationPrice(400, 400, 'short')).toBe(true);
    });

    it('returns false when current price is safely below liquidation', () => {
      expect(isNearLiquidationPrice(300, 400, 'short')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false when liquidation price is null', () => {
      expect(isNearLiquidationPrice(45000, null, 'long')).toBe(false);
    });

    it('returns false when liquidation price is undefined', () => {
      expect(isNearLiquidationPrice(45000, undefined, 'long')).toBe(false);
    });

    it('returns false when liquidation price is zero', () => {
      expect(isNearLiquidationPrice(45000, 0, 'long')).toBe(false);
    });

    it('returns false when liquidation price is negative', () => {
      expect(isNearLiquidationPrice(45000, -100, 'long')).toBe(false);
    });

    it('returns false when current price is zero', () => {
      expect(isNearLiquidationPrice(0, 40000, 'long')).toBe(false);
    });
  });
});
