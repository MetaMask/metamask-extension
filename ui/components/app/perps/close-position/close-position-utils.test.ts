import {
  estimateClosePositionReceive,
  getCloseLimitReferencePrice,
  getCloseMarginWithPnl,
  getClosePositionProviderId,
  isCloseLimitPriceOutsideDeviation,
  parsePositivePrice,
  roundCloseUsd,
} from './close-position-utils';

describe('close position utilities', () => {
  describe('parsePositivePrice', () => {
    [undefined, null, '', '0', 0, -1, 'NaN', NaN, Infinity].forEach((value) => {
      it(`rejects invalid price ${String(value)}`, () => {
        expect(parsePositivePrice(value)).toBeNull();
      });
    });

    it('parses formatted positive prices', () => {
      expect(parsePositivePrice('$1,234.50')).toBe(1234.5);
    });
  });

  describe('getCloseLimitReferencePrice', () => {
    it('prefers a valid mark price', () => {
      expect(
        getCloseLimitReferencePrice({
          markPrice: 100,
          currentPrice: 101,
          midPrice: 102,
        }),
      ).toBe(100);
    });

    it('falls back when mark and current prices are invalid', () => {
      expect(
        getCloseLimitReferencePrice({
          markPrice: NaN,
          currentPrice: 0,
          midPrice: 102,
        }),
      ).toBe(102);
    });
  });

  describe('isCloseLimitPriceOutsideDeviation', () => {
    it('accepts both sides of the exact 95% boundary', () => {
      expect(isCloseLimitPriceOutsideDeviation(5, 100)).toBe(false);
      expect(isCloseLimitPriceOutsideDeviation(100, 5)).toBe(false);
    });

    it('rejects both sides strictly outside the boundary', () => {
      expect(isCloseLimitPriceOutsideDeviation(4.99, 100)).toBe(true);
      expect(isCloseLimitPriceOutsideDeviation(100, 4.99)).toBe(true);
    });

    [NaN, Infinity, 0, -1, undefined].forEach((limitPrice) => {
      it(`rejects invalid limit price ${String(limitPrice)}`, () => {
        expect(isCloseLimitPriceOutsideDeviation(limitPrice, 100)).toBe(true);
      });
    });

    [NaN, Infinity, 0, -1, undefined].forEach((referencePrice) => {
      it(`rejects invalid reference price ${String(referencePrice)}`, () => {
        expect(isCloseLimitPriceOutsideDeviation(100, referencePrice)).toBe(
          true,
        );
      });
    });
  });

  describe('roundCloseUsd', () => {
    it('rounds half away from zero to cents', () => {
      expect(roundCloseUsd(1.005)).toBe(1.01);
      expect(roundCloseUsd(8.995)).toBe(9);
      expect(roundCloseUsd(-8.995)).toBe(-9);
    });

    it('accepts figures with more than 15 significant digits', () => {
      expect(roundCloseUsd(1999.9998222222223)).toBe(2000);
    });

    it('keeps an unavailable figure unavailable', () => {
      expect(roundCloseUsd(undefined)).toBeUndefined();
    });
  });

  describe('getCloseMarginWithPnl', () => {
    it('adds the realized PnL to the margin returned, rounded to cents', () => {
      expect(
        getCloseMarginWithPnl({
          marginReturned: 62.5625,
          realizedPnl: -0.125,
          fee: 0.01,
          receive: 62.43,
        }),
      ).toBe(62.44);
    });

    it('is unavailable while either figure is', () => {
      expect(
        getCloseMarginWithPnl({
          marginReturned: undefined,
          realizedPnl: 1,
          fee: 0,
          receive: undefined,
        }),
      ).toBeUndefined();
    });
  });

  describe('getClosePositionProviderId', () => {
    it("prefers the position's provider", () => {
      expect(
        getClosePositionProviderId({ providerId: 'lighter' }, 'aggregated'),
      ).toBe('lighter');
    });

    it('falls back to the active direct provider', () => {
      expect(getClosePositionProviderId({}, 'hyperliquid')).toBe('hyperliquid');
    });

    it('is unknown for an aggregated position without a provider', () => {
      expect(getClosePositionProviderId({}, 'aggregated')).toBeUndefined();
    });
  });

  describe('estimateClosePositionReceive', () => {
    const position = {
      size: '1',
      entryPrice: '100',
      marginUsed: '50',
      unrealizedPnl: '0',
      leverage: { type: 'isolated' as const },
    };

    it("returns Core's estimate for a known provider", () => {
      expect(
        estimateClosePositionReceive({
          position,
          providerId: 'hyperliquid',
          closeSize: 1,
          price: 101,
          feeRate: 0.001,
        }),
      ).toStrictEqual({
        marginReturned: 50,
        realizedPnl: 1,
        fee: 0.101,
        receive: 50.9,
      });
    });

    it('returns every figure unavailable for an unknown provider', () => {
      expect(
        estimateClosePositionReceive({
          position,
          providerId: undefined,
          closeSize: 1,
          price: 101,
          feeRate: 0.001,
        }),
      ).toStrictEqual({
        marginReturned: undefined,
        realizedPnl: undefined,
        fee: undefined,
        receive: undefined,
      });
    });
  });
});
