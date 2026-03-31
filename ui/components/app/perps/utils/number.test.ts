import { floorToDecimals, formatFlooredDecimals } from './number';

describe('perps number utils', () => {
  describe('floorToDecimals', () => {
    it('avoids extra-cent underflow for IEEE-754 edge values', () => {
      expect(floorToDecimals(0.29, 2)).toBe(0.29);
      expect(floorToDecimals(1.15, 2)).toBe(1.15);
      expect(floorToDecimals(2.29, 2)).toBe(2.29);
    });

    it('still floors values above the target precision', () => {
      expect(floorToDecimals(3.066, 2)).toBe(3.06);
      expect(floorToDecimals(1.159, 2)).toBe(1.15);
    });
  });

  describe('formatFlooredDecimals', () => {
    it('returns fixed-width floored strings', () => {
      expect(formatFlooredDecimals(3.066, 2)).toBe('3.06');
      expect(formatFlooredDecimals(1.15, 2)).toBe('1.15');
    });
  });
});
