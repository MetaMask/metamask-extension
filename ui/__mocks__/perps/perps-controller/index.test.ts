import {
  FEEDBACK_CONFIG,
  getMarketTypeFilter,
  MARKET_CATEGORIES,
  SUPPORT_CONFIG,
} from '.';

describe('@metamask/perps-controller mock', () => {
  it('exports SUPPORT_CONFIG with the expected URL and UI keys', () => {
    expect(SUPPORT_CONFIG.Url).toBe(
      'https://support.metamask.io/?utm_source=extension',
    );
    expect(SUPPORT_CONFIG.TitleKey).toBe('perps.support.title');
    expect(SUPPORT_CONFIG.DescriptionKey).toBe('perps.support.description');
  });

  it('exports FEEDBACK_CONFIG with the expected URL and UI key', () => {
    expect(typeof FEEDBACK_CONFIG.Url).toBe('string');
    expect(FEEDBACK_CONFIG.TitleKey).toBe('perps.feedback.title');
  });

  it('exports v8 market category helpers', () => {
    expect(MARKET_CATEGORIES).toEqual([
      'crypto',
      'stock',
      'pre-ipo',
      'index',
      'etf',
      'commodity',
      'forex',
    ]);
    expect(
      getMarketTypeFilter({ marketSource: 'xyz', marketType: 'stock' }),
    ).toBe('stock');
    expect(getMarketTypeFilter({ marketSource: 'xyz' })).toBe('new');
    expect(getMarketTypeFilter({})).toBe('crypto');
  });
});
