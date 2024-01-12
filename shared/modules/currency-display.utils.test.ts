import {
  showPrimaryCurrency,
  showSecondaryCurrency,
} from './currency-display.utils';

describe('showPrimaryCurrency', () => {
  it('should return true when useNativeCurrencyAsPrimaryCurrency is true', () => {
    const result = showPrimaryCurrency(true, true);
    expect(result).toBe(true);
  });

  it('should return true when isOriginalNativeSymbol is true', () => {
    const result = showPrimaryCurrency(true, false);
    expect(result).toBe(true);
  });

  it('should return false when useNativeCurrencyAsPrimaryCurrency and isOriginalNativeSymbol are false', () => {
    const result = showPrimaryCurrency(false, false);
    expect(result).toBe(false);
  });
});

describe('showSecondaryCurrency', () => {
  it('should return true when useNativeCurrencyAsPrimaryCurrency is false', () => {
    const result = showSecondaryCurrency(true, false);
    expect(result).toBe(true);
  });

  it('should return true when isOriginalNativeSymbol is true', () => {
    const result = showSecondaryCurrency(true, true);
    expect(result).toBe(true);
  });

  it('should return false when useNativeCurrencyAsPrimaryCurrency is true and isOriginalNativeSymbol is false', () => {
    const result = showSecondaryCurrency(false, true);
    expect(result).toBe(false);
  });
});
