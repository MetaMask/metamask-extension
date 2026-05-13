import { formatSlippagePct } from './slippageFormat';

describe('formatSlippagePct', () => {
  it('returns ">10%" when liquidity is insufficient', () => {
    expect(formatSlippagePct(null, true)).toBe('>10%');
    expect(formatSlippagePct(5, true)).toBe('>10%');
  });

  it('returns "—" when estimate is null and liquidity is sufficient', () => {
    expect(formatSlippagePct(null, false)).toBe('—');
  });

  it('returns "<0.01%" for sub-rounding-threshold non-zero estimates', () => {
    expect(formatSlippagePct(0.0001, false)).toBe('<0.01%');
    expect(formatSlippagePct(0.0099, false)).toBe('<0.01%');
  });

  it('returns two-decimal percent for in-range estimates', () => {
    expect(formatSlippagePct(0.01, false)).toBe('0.01%');
    expect(formatSlippagePct(3, false)).toBe('3.00%');
    expect(formatSlippagePct(9.876, false)).toBe('9.88%');
  });
});
