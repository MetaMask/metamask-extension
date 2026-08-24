import { HomeQueryParams } from './home';
import { DEFAULT_ROUTE } from './route';
import { trending } from './trending';

describe('trending deep link route', () => {
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
