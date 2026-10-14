import { sanitizeUrlPath } from './url-path';

describe('sanitizeUrlPath', () => {
  it('returns the pathname, stripping query params and origin', () => {
    expect(
      sanitizeUrlPath('https://provider.example/checkout/abc?wallet=0x123'),
    ).toBe('/checkout/abc');
  });

  it('returns an empty string for an unparseable URL', () => {
    expect(sanitizeUrlPath('not a url')).toBe('');
  });
});
