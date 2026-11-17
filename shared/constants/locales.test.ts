import {
  narrowSymbolExempt,
  usesNarrowUsdSymbol,
} from '#shared/constants/locales';

describe('usesNarrowUsdSymbol', () => {
  it('does not use narrowSymbol for a known exception region', () => {
    for (const region of narrowSymbolExempt) {
      expect(usesNarrowUsdSymbol(region)).toBe(false);
    }
  });

  it('uses narrowSymbol for a region outside the known list', () => {
    expect(usesNarrowUsdSymbol(undefined)).toBe(true);
    expect(usesNarrowUsdSymbol('XX')).toBe(true);
  });
});
