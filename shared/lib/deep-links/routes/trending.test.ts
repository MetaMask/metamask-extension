import { HomeQueryParams } from './home';
import { DEFAULT_ROUTE, DISCOVER_SEARCH_ROUTE } from './route';
import { trending } from './trending';

describe('trending deep link route', () => {
  it('opens Discover Search with the q query pre-populated', () => {
    const params = new URLSearchParams({
      screen: 'search',
      q: 'Apple Inc & Co',
    });

    const destination = trending.handler(params);

    expect(destination).toHaveProperty('path', DISCOVER_SEARCH_ROUTE);
    expect((destination as { query: URLSearchParams }).query.get('q')).toBe(
      'Apple Inc & Co',
    );
    expect((destination as { query: URLSearchParams }).query.toString()).toBe(
      'q=Apple+Inc+%26+Co',
    );
  });

  it('uses the query alias when q is empty', () => {
    const params = new URLSearchParams({
      screen: 'search',
      q: '',
      query: 'Apple',
    });

    const destination = trending.handler(params);

    expect((destination as { query: URLSearchParams }).query.get('q')).toBe(
      'Apple',
    );
  });

  it('opens Discover Search without a query when q and query are missing', () => {
    const params = new URLSearchParams({ screen: 'search' });

    const destination = trending.handler(params);

    expect(destination).toHaveProperty('path', DISCOVER_SEARCH_ROUTE);
    expect((destination as { query: URLSearchParams }).query.toString()).toBe(
      '',
    );
  });

  it('opens the default route with QR modal params for the trending deeplink', () => {
    const params = new URLSearchParams();

    const destination = trending.handler(params);

    expect(destination).toHaveProperty('path');
    expect((destination as { path: string }).path).toBe(DEFAULT_ROUTE);
    expect(
      (destination as { query: URLSearchParams }).query.get(
        HomeQueryParams.TrendingDeeplinkUrl,
      ),
    ).toBe('https://link.metamask.io/trending');
  });

  it('includes query parameters in the QR deeplink', () => {
    const params = new URLSearchParams({ tab: 'crypto' });

    const destination = trending.handler(params);

    expect(
      (destination as { query: URLSearchParams }).query.get(
        HomeQueryParams.TrendingDeeplinkUrl,
      ),
    ).toBe('https://link.metamask.io/trending?tab=crypto');
  });
});
