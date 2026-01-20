import { parseVolume } from './usePerpsMarkets';

describe('parseVolume', () => {
  describe('magnitude suffixes', () => {
    it('parses billions correctly', () => {
      expect(parseVolume('$1.2B')).toBe(1.2e9);
      expect(parseVolume('$2.5B')).toBe(2.5e9);
      expect(parseVolume('1B')).toBe(1e9);
    });

    it('parses millions correctly', () => {
      expect(parseVolume('$850M')).toBe(850e6);
      expect(parseVolume('$1.5M')).toBe(1.5e6);
      expect(parseVolume('100M')).toBe(100e6);
    });

    it('parses thousands correctly', () => {
      expect(parseVolume('$500K')).toBe(500e3);
      expect(parseVolume('$1.2K')).toBe(1.2e3);
      expect(parseVolume('50K')).toBe(50e3);
    });

    it('parses trillions correctly', () => {
      expect(parseVolume('$1.5T')).toBe(1.5e12);
      expect(parseVolume('2T')).toBe(2e12);
    });
  });

  describe('numbers with commas', () => {
    it('handles comma-separated numbers', () => {
      expect(parseVolume('$1,234')).toBe(1234);
      expect(parseVolume('$1,234,567')).toBe(1234567);
      expect(parseVolume('$1,234M')).toBe(1234e6);
    });
  });

  describe('numbers without suffix', () => {
    it('parses plain numbers', () => {
      expect(parseVolume('$100')).toBe(100);
      expect(parseVolume('$1234.56')).toBe(1234.56);
      expect(parseVolume('500')).toBe(500);
    });
  });

  describe('special cases', () => {
    it('returns -1 for undefined', () => {
      expect(parseVolume(undefined)).toBe(-1);
    });

    it('returns -1 for fallback display "--"', () => {
      expect(parseVolume('--')).toBe(-1);
    });

    it('returns 0.5 for "$<1"', () => {
      expect(parseVolume('$<1')).toBe(0.5);
    });

    it('returns -1 for empty string', () => {
      expect(parseVolume('')).toBe(-1);
    });

    it('returns -1 for invalid format', () => {
      expect(parseVolume('invalid')).toBe(-1);
      expect(parseVolume('abc')).toBe(-1);
    });
  });

  describe('edge cases', () => {
    it('handles zero', () => {
      expect(parseVolume('$0')).toBe(0);
      expect(parseVolume('0')).toBe(0);
    });

    it('handles decimal values', () => {
      expect(parseVolume('$0.5M')).toBe(0.5e6);
      expect(parseVolume('$0.01B')).toBe(0.01e9);
    });
  });
});
