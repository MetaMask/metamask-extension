import {
  getCloseLimitReferencePrice,
  isCloseLimitPriceOutsideDeviation,
  parsePositivePrice,
} from './close-position-utils';

describe('close position utilities', () => {
  describe('parsePositivePrice', () => {
    [undefined, null, '', '0', 0, -1, 'NaN', NaN, Infinity].forEach(
      (value) => {
        it(`rejects invalid price ${String(value)}`, () => {
        expect(parsePositivePrice(value)).toBeNull();
        });
      },
    );

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
});
