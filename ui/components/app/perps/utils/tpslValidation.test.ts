import {
  isValidTakeProfitPrice,
  isValidStopLossPrice,
  getTakeProfitErrorDirection,
  getStopLossErrorDirection,
} from './tpslValidation';

describe('tpslValidation', () => {
  describe('isValidTakeProfitPrice', () => {
    const currentPrice = 50000;

    describe('long direction', () => {
      it('returns true when TP is above current price', () => {
        expect(
          isValidTakeProfitPrice('55000', {
            currentPrice,
            direction: 'long',
          }),
        ).toBe(true);
      });

      it('returns false when TP is below current price', () => {
        expect(
          isValidTakeProfitPrice('45000', {
            currentPrice,
            direction: 'long',
          }),
        ).toBe(false);
      });

      it('returns false when TP equals current price', () => {
        expect(
          isValidTakeProfitPrice('50000', {
            currentPrice,
            direction: 'long',
          }),
        ).toBe(false);
      });
    });

    describe('short direction', () => {
      it('returns true when TP is below current price', () => {
        expect(
          isValidTakeProfitPrice('45000', {
            currentPrice,
            direction: 'short',
          }),
        ).toBe(true);
      });

      it('returns false when TP is above current price', () => {
        expect(
          isValidTakeProfitPrice('55000', {
            currentPrice,
            direction: 'short',
          }),
        ).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('returns true for empty price', () => {
        expect(
          isValidTakeProfitPrice('', { currentPrice, direction: 'long' }),
        ).toBe(true);
      });

      it('returns true for NaN price', () => {
        expect(
          isValidTakeProfitPrice('abc', { currentPrice, direction: 'long' }),
        ).toBe(true);
      });

      it('returns true when currentPrice is 0', () => {
        expect(
          isValidTakeProfitPrice('100', {
            currentPrice: 0,
            direction: 'long',
          }),
        ).toBe(true);
      });

      it('returns true when direction is undefined', () => {
        expect(isValidTakeProfitPrice('100', { currentPrice })).toBe(true);
      });

      it('handles formatted prices with commas and dollar signs', () => {
        expect(
          isValidTakeProfitPrice('$55,000', {
            currentPrice,
            direction: 'long',
          }),
        ).toBe(true);

        expect(
          isValidTakeProfitPrice('$45,000', {
            currentPrice,
            direction: 'long',
          }),
        ).toBe(false);
      });
    });
  });

  describe('isValidStopLossPrice', () => {
    const currentPrice = 50000;

    describe('long direction', () => {
      it('returns true when SL is below current price', () => {
        expect(
          isValidStopLossPrice('45000', {
            currentPrice,
            direction: 'long',
          }),
        ).toBe(true);
      });

      it('returns false when SL is above current price', () => {
        expect(
          isValidStopLossPrice('55000', {
            currentPrice,
            direction: 'long',
          }),
        ).toBe(false);
      });

      it('returns false when SL equals current price', () => {
        expect(
          isValidStopLossPrice('50000', {
            currentPrice,
            direction: 'long',
          }),
        ).toBe(false);
      });
    });

    describe('short direction', () => {
      it('returns true when SL is above current price', () => {
        expect(
          isValidStopLossPrice('55000', {
            currentPrice,
            direction: 'short',
          }),
        ).toBe(true);
      });

      it('returns false when SL is below current price', () => {
        expect(
          isValidStopLossPrice('45000', {
            currentPrice,
            direction: 'short',
          }),
        ).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('returns true for empty price', () => {
        expect(
          isValidStopLossPrice('', { currentPrice, direction: 'long' }),
        ).toBe(true);
      });

      it('returns true for NaN price', () => {
        expect(
          isValidStopLossPrice('abc', { currentPrice, direction: 'long' }),
        ).toBe(true);
      });

      it('returns true when currentPrice is 0', () => {
        expect(
          isValidStopLossPrice('100', {
            currentPrice: 0,
            direction: 'long',
          }),
        ).toBe(true);
      });

      it('returns true when direction is undefined', () => {
        expect(isValidStopLossPrice('100', { currentPrice })).toBe(true);
      });

      it('handles formatted prices with commas and dollar signs', () => {
        expect(
          isValidStopLossPrice('$45,000', {
            currentPrice,
            direction: 'long',
          }),
        ).toBe(true);

        expect(
          isValidStopLossPrice('$55,000', {
            currentPrice,
            direction: 'long',
          }),
        ).toBe(false);
      });
    });
  });

  describe('getTakeProfitErrorDirection', () => {
    it('returns "above" for long', () => {
      expect(getTakeProfitErrorDirection('long')).toBe('above');
    });

    it('returns "below" for short', () => {
      expect(getTakeProfitErrorDirection('short')).toBe('below');
    });

    it('returns empty string for undefined', () => {
      expect(getTakeProfitErrorDirection(undefined)).toBe('');
    });
  });

  describe('getStopLossErrorDirection', () => {
    it('returns "below" for long', () => {
      expect(getStopLossErrorDirection('long')).toBe('below');
    });

    it('returns "above" for short', () => {
      expect(getStopLossErrorDirection('short')).toBe('above');
    });

    it('returns empty string for undefined', () => {
      expect(getStopLossErrorDirection(undefined)).toBe('');
    });
  });
});
