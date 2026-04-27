import {
  formatPriceImpactFiat,
  formatPriceImpactPercentage,
} from './price-impact';

describe('formatPriceImpact', () => {
  it('should return 0% for undefined', () => {
    expect(formatPriceImpactPercentage(undefined)).toBeNull();
  });

  it('should return 0% for 0', () => {
    expect(formatPriceImpactPercentage(0)).toBe('0%');
    expect(formatPriceImpactPercentage('0')).toBe('0%');
  });

  it('should return <0.01% for very small positive values', () => {
    expect(formatPriceImpactPercentage('0.00007998969070672714')).toBe(
      '<0.01%',
    );
    expect(formatPriceImpactPercentage('0.00009')).toBe('<0.01%');
    expect(formatPriceImpactPercentage('0.00009')).toBe('<0.01%');
  });

  it('should return 0% for very small negative values', () => {
    expect(formatPriceImpactPercentage(-0.00007)).toBe('0%');
    expect(formatPriceImpactPercentage(-0.00009)).toBe('0%');
    expect(formatPriceImpactPercentage('-0.00009')).toBe('0%');
  });

  it('should format with expected precision for typical ranges', () => {
    // <1% → 2 decimals
    expect(formatPriceImpactPercentage(0.0001)).toBe('0.01%');
    expect(formatPriceImpactPercentage(0.001)).toBe('0.10%');
    // 1%–10% → 1 decimal
    expect(formatPriceImpactPercentage(0.01)).toBe('1.0%');
    expect(formatPriceImpactPercentage(0.015)).toBe('1.5%');
    expect(formatPriceImpactPercentage(0.031415)).toBe('3.1%');
    // ≥10% → no decimals
    expect(formatPriceImpactPercentage(0.10999)).toBe('11%');
  });

  it('should handle negative values correctly', () => {
    expect(formatPriceImpactPercentage(-0.001)).toBe('0%');
    expect(formatPriceImpactPercentage(-0.015)).toBe('0%');
    expect(formatPriceImpactPercentage(-0.1)).toBe('0%');
  });

  it('should handle string inputs', () => {
    expect(formatPriceImpactPercentage('0.015')).toBe('1.5%');
    expect(formatPriceImpactPercentage('0.00007')).toBe('<0.01%');
    expect(formatPriceImpactPercentage('-0.02567')).toBe('0%');
  });
});

describe('formatPriceImpactFiat', () => {
  it('returns undefined when activeQuote is null', () => {
    expect(formatPriceImpactFiat(null, 'usd')).toBeUndefined();
  });

  it('returns undefined when activeQuote is undefined', () => {
    expect(formatPriceImpactFiat(undefined, 'usd')).toBeUndefined();
  });

  it('returns undefined when sentAmount.valueInCurrency is null', () => {
    expect(
      formatPriceImpactFiat(
        {
          sentAmount: { valueInCurrency: null },
          toTokenAmount: { valueInCurrency: '900' },
        },
        'usd',
      ),
    ).toBeUndefined();
  });

  it('returns undefined when toTokenAmount.valueInCurrency is undefined', () => {
    expect(
      formatPriceImpactFiat(
        {
          sentAmount: { valueInCurrency: '1000' },
          toTokenAmount: { valueInCurrency: undefined },
        },
        'usd',
      ),
    ).toBeUndefined();
  });

  it('returns undefined when sentAmount is missing', () => {
    expect(
      formatPriceImpactFiat(
        { toTokenAmount: { valueInCurrency: '900' } },
        'usd',
      ),
    ).toBeUndefined();
  });

  it('returns undefined when toTokenAmount is missing', () => {
    expect(
      formatPriceImpactFiat({ sentAmount: { valueInCurrency: '1000' } }, 'usd'),
    ).toBeUndefined();
  });

  it('formats the absolute difference between source and destination fiat amounts', () => {
    const result = formatPriceImpactFiat(
      {
        sentAmount: { valueInCurrency: '1000' },
        toTokenAmount: { valueInCurrency: '995.77' },
      },
      'usd',
    );
    expect(result).toBeDefined();
    expect(result).toContain('4.23');
  });

  it('uses the absolute value so a favourable quote does not produce a negative result', () => {
    const result = formatPriceImpactFiat(
      {
        sentAmount: { valueInCurrency: '900' },
        toTokenAmount: { valueInCurrency: '1000' },
      },
      'usd',
    );
    expect(result).toBeDefined();
    expect(result).toContain('100');
  });

  it('handles string numeric inputs', () => {
    const result = formatPriceImpactFiat(
      {
        sentAmount: { valueInCurrency: '500.50' },
        toTokenAmount: { valueInCurrency: '496.27' },
      },
      'usd',
    );
    expect(result).toBeDefined();
    expect(result).toContain('4.23');
  });

  it('handles numeric inputs', () => {
    const result = formatPriceImpactFiat(
      {
        sentAmount: { valueInCurrency: 1000 },
        toTokenAmount: { valueInCurrency: 990 },
      },
      'usd',
    );
    expect(result).toBeDefined();
    expect(result).toContain('10');
  });
});
