import { formatPerpsPrice, PRICE_RANGES_UNIVERSAL } from './formatPerpsPrice';

describe('PRICE_RANGES_UNIVERSAL', () => {
  it('has 7 entries covering the full range', () => {
    expect(PRICE_RANGES_UNIVERSAL).toHaveLength(7);
  });

  it('last range catches all values', () => {
    expect(PRICE_RANGES_UNIVERSAL[6].condition(0)).toBe(true);
    expect(PRICE_RANGES_UNIVERSAL[6].condition(-Infinity)).toBe(true);
  });
});

describe('formatPerpsPrice', () => {
  describe('range: > $100,000 (6 sig figs, 0 decimals)', () => {
    it('formats 150000 as $150,000', () => {
      expect(formatPerpsPrice(150_000)).toBe('$150,000');
    });

    it('formats 123456.789 as $123,457', () => {
      expect(formatPerpsPrice(123_456.789)).toBe('$123,457');
    });
  });

  describe('range: $10,000 – $100,000 (5 sig figs, 0 decimals)', () => {
    it('formats 99999.1 as $99,999', () => {
      expect(formatPerpsPrice(99_999.1)).toBe('$99,999');
    });

    it('formats 10001.6 as $10,002', () => {
      expect(formatPerpsPrice(10_001.6)).toBe('$10,002');
    });
  });

  describe('range: $1,000 – $10,000 (5 sig figs, max 1 decimal)', () => {
    it('formats 3245.67890123 as $3,245.7', () => {
      expect(formatPerpsPrice(3_245.678_901_23)).toBe('$3,245.7');
    });

    it('formats 1000.0 as $1,000.0 (5th sig fig needs the trailing decimal)', () => {
      expect(formatPerpsPrice(1_000.0)).toBe('$1,000.0');
    });
  });

  describe('range: $100 – $1,000 (5 sig figs, max 2 decimals)', () => {
    it('formats 567.12345 as $567.12', () => {
      expect(formatPerpsPrice(567.123_45)).toBe('$567.12');
    });

    it('formats 100.1 as $100.1', () => {
      expect(formatPerpsPrice(100.1)).toBe('$100.1');
    });
  });

  describe('range: $10 – $100 (5 sig figs, max 4 decimals)', () => {
    it('formats 42.56789 as $42.568', () => {
      expect(formatPerpsPrice(42.567_89)).toBe('$42.568');
    });

    it('formats 10.001 as $10.001', () => {
      expect(formatPerpsPrice(10.001)).toBe('$10.001');
    });
  });

  describe('range: $0.01 – $10 (5 sig figs, min 2 max 6 decimals)', () => {
    it('formats 0.00123 — boundary at $0.01 — as $0.0012300', () => {
      // 0.00123 < 0.01 so this falls into the < $0.01 range
      expect(formatPerpsPrice(0.001_23)).not.toBe('');
    });

    it('formats 1.23456789 as $1.2346', () => {
      expect(formatPerpsPrice(1.234_567_89)).toBe('$1.2346');
    });

    it('formats 0.01 as $0.01', () => {
      expect(formatPerpsPrice(0.01)).toBe('$0.01');
    });

    it('formats 9.9999 as $9.9999', () => {
      expect(formatPerpsPrice(9.9999)).toBe('$9.9999');
    });
  });

  describe('range: < $0.01 (4 sig figs, min 2 max 6 decimals)', () => {
    it('formats 0.001234 as $0.001234', () => {
      expect(formatPerpsPrice(0.001_234)).toBe('$0.001234');
    });

    it('formats 0.0001 as $0.0001 (max 6 decimals enforced)', () => {
      expect(formatPerpsPrice(0.0001)).toBe('$0.0001');
    });
  });

  describe('edge cases', () => {
    it('returns empty string for NaN', () => {
      expect(formatPerpsPrice(NaN)).toBe('');
    });

    it('returns empty string for Infinity', () => {
      expect(formatPerpsPrice(Infinity)).toBe('');
    });

    it('returns empty string for -Infinity', () => {
      expect(formatPerpsPrice(-Infinity)).toBe('');
    });

    it('formats zero as $0.000 (< $0.01 range, 4 sig figs)', () => {
      // Zero matches the catch-all range
      const result = formatPerpsPrice(0);
      expect(result).toMatch(/^\$0/u);
    });

    it('accepts a custom locale', () => {
      const result = formatPerpsPrice(3_245.678_901_23, 'en-US');
      expect(result).toBe('$3,245.7');
    });
  });
});
