import {
  narrowSymbolExempt,
  narrowSymbolRegions,
  usesNarrowUsdSymbol,
} from '#shared/constants/locales';

describe('usesNarrowUsdSymbol', () => {
  it('uses narrowSymbol only for a selected region', () => {
    expect(usesNarrowUsdSymbol(undefined)).toBe(false);

    for (const region of narrowSymbolRegions) {
      expect(usesNarrowUsdSymbol(region)).toBe(!narrowSymbolExempt.has(region));
    }
  });

  it('does not use narrowSymbol for a region that is not selected', () => {
    expect(usesNarrowUsdSymbol('GB')).toBe(narrowSymbolRegions.has('GB'));

    for (const region of narrowSymbolExempt) {
      expect(usesNarrowUsdSymbol(region)).toBe(false);
    }
  });
});
