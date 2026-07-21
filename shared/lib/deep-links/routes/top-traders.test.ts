import { HomeQueryParams } from './home';
import { DEFAULT_ROUTE } from './route';
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

  it('uses original query parameters in the QR deeplink', () => {
    expect(topTraders.handlerSearchParams).toBe('original');
  });

  it('opens the default route with QR modal params for the top traders deeplink', () => {
    const destination = topTraders.handler(new URLSearchParams());

    expect(destination).toHaveProperty('path');
    expect((destination as { path: string }).path).toBe(DEFAULT_ROUTE);
    expect(
      (destination as { query: URLSearchParams }).query.get(
        HomeQueryParams.TopTradersDeeplinkUrl,
      ),
    ).toBe('https://link.metamask.io/top-traders');
  });

  it('forwards incoming query params into the QR deeplink', () => {
    const params = new URLSearchParams('utm_source=twitter');
    const destination = topTraders.handler(params);

    expect(
      (destination as { query: URLSearchParams }).query.get(
        HomeQueryParams.TopTradersDeeplinkUrl,
      ),
    ).toBe('https://link.metamask.io/top-traders?utm_source=twitter');
  });
});
