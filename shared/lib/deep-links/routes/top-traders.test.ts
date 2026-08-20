import { BaseUrl } from '../../../constants/urls';
import { topTraders } from './top-traders';

describe('top-traders deep link route', () => {
  it('has the correct pathname', () => {
    expect(topTraders.pathname).toBe('/top-traders');
  });

  it('returns the correct title key', () => {
    expect(topTraders.getTitle(new URLSearchParams())).toBe(
      'deepLink_theTopTradersPage',
    );
  });

  it('redirects to the Follow Trading landing page', () => {
    const result = topTraders.handler(new URLSearchParams());

    expect('redirectTo' in result).toBe(true);

    const { redirectTo } = result as { redirectTo: URL };
    expect(redirectTo.toString()).toBe(`${BaseUrl.MetaMask}/news/top-traders`);
  });

  it('ignores incoming query params and redirects to the bare landing page', () => {
    const params = new URLSearchParams({ ref: 'extension', foo: 'bar' });
    const result = topTraders.handler(params);

    const { redirectTo } = result as { redirectTo: URL };
    expect(redirectTo.toString()).toBe(`${BaseUrl.MetaMask}/news/top-traders`);
    expect(redirectTo.search).toBe('');
  });
});
