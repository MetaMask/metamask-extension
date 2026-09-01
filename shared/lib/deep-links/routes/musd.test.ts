import { musd, MUSD_DEEPLINK_PARAM } from './musd';

describe('musd deep link route', () => {
  it('has the correct pathname', () => {
    expect(musd.pathname).toBe('/earn-musd');
  });

  it('returns the correct title key', () => {
    expect(musd.getTitle(new URLSearchParams())).toBe(
      'deepLink_theMusdEducationPage',
    );
  });

  it('returns an in-extension path with isDeeplink=true', () => {
    const result = musd.handler(new URLSearchParams());

    expect('path' in result).toBe(true);
    expect('query' in result).toBe(true);

    const { path, query } = result as { path: string; query: URLSearchParams };
    expect(path).toBe('/musd/education');
    expect(query.get(MUSD_DEEPLINK_PARAM)).toBe('true');
  });

  it('forwards incoming query params alongside isDeeplink', () => {
    const params = new URLSearchParams({ token: '0xabc', chain: '0x1' });
    const result = musd.handler(params);

    const { query } = result as { path: string; query: URLSearchParams };
    expect(query.get(MUSD_DEEPLINK_PARAM)).toBe('true');
    expect(query.get('token')).toBe('0xabc');
    expect(query.get('chain')).toBe('0x1');
  });
});
