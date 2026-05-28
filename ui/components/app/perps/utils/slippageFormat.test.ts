import { formatSlippageRowValue, formatMaxSlippagePct } from './slippageFormat';

describe('formatSlippageRowValue', () => {
  it('shows "Est: --" when estimate is null', () => {
    expect(formatSlippageRowValue(null, 3, false)).toBe(
      'Est: -- / Max: 3.0%',
    );
  });

  it('shows ">max" when liquidity is insufficient', () => {
    expect(formatSlippageRowValue(null, 3, true)).toBe(
      'Est: >max / Max: 3.0%',
    );
    expect(formatSlippageRowValue(5, 3, true)).toBe('Est: >max / Max: 3.0%');
  });

  it('formats estimated percent with two decimals', () => {
    expect(formatSlippageRowValue(0.15, 3, false)).toBe(
      'Est: 0.15% / Max: 3.0%',
    );
    expect(formatSlippageRowValue(0, 3, false)).toBe(
      'Est: 0.00% / Max: 3.0%',
    );
    expect(formatSlippageRowValue(2.567, 5, false)).toBe(
      'Est: 2.57% / Max: 5.0%',
    );
  });

  it('formats max with one decimal', () => {
    expect(formatSlippageRowValue(0.1, 0.1, false)).toBe(
      'Est: 0.10% / Max: 0.1%',
    );
    expect(formatSlippageRowValue(1, 10, false)).toBe(
      'Est: 1.00% / Max: 10.0%',
    );
  });
});

describe('formatMaxSlippagePct', () => {
  it('formats with one decimal place', () => {
    expect(formatMaxSlippagePct(3)).toBe('3.0%');
    expect(formatMaxSlippagePct(0.1)).toBe('0.1%');
    expect(formatMaxSlippagePct(5)).toBe('5.0%');
    expect(formatMaxSlippagePct(1.2)).toBe('1.2%');
  });
});
