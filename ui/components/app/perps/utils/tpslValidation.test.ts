import {
  getTakeProfitErrorDirection,
  getStopLossErrorDirection,
  getStopLossLiquidationErrorDirection,
} from './tpslValidation';

describe('tpslValidation', () => {
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

  describe('getStopLossLiquidationErrorDirection', () => {
    it('returns "above" for long', () => {
      expect(getStopLossLiquidationErrorDirection('long')).toBe('above');
    });

    it('returns "below" for short', () => {
      expect(getStopLossLiquidationErrorDirection('short')).toBe('below');
    });

    it('returns empty string for undefined', () => {
      expect(getStopLossLiquidationErrorDirection(undefined)).toBe('');
    });
  });
});
