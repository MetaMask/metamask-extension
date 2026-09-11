import { DEFAULT_ROUTE } from '../constants/routes';
import { getRedirectAfterUnlock } from './redirect-after-unlock';

describe('getRedirectAfterUnlock', () => {
  it('returns the default route when there is no intended location', () => {
    expect(getRedirectAfterUnlock(null)).toBe(DEFAULT_ROUTE);
    expect(getRedirectAfterUnlock(undefined)).toBe(DEFAULT_ROUTE);
    expect(getRedirectAfterUnlock({})).toBe(DEFAULT_ROUTE);
    expect(getRedirectAfterUnlock({ from: {} })).toBe(DEFAULT_ROUTE);
  });

  it('returns the intended pathname', () => {
    expect(getRedirectAfterUnlock({ from: { pathname: '/settings' } })).toBe(
      '/settings',
    );
  });

  it('keeps the search string', () => {
    expect(
      getRedirectAfterUnlock({
        from: { pathname: '/settings', search: '?tab=privacy' },
      }),
    ).toBe('/settings?tab=privacy');
  });

  it('keeps the hash, which deep links use as a scroll target', () => {
    expect(
      getRedirectAfterUnlock({
        from: { pathname: '/settings/privacy', hash: '#data-collection' },
      }),
    ).toBe('/settings/privacy#data-collection');
  });

  it('keeps the search and the hash together', () => {
    expect(
      getRedirectAfterUnlock({
        from: {
          pathname: '/settings/privacy',
          search: '?foo=bar',
          hash: '#metametrics',
        },
      }),
    ).toBe('/settings/privacy?foo=bar#metametrics');
  });
});
