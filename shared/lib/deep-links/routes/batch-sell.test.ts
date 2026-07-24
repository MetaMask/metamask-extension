import { batchSell } from './batch-sell';
import { HomeQueryParams } from './home';
import { DEFAULT_ROUTE } from './route';

describe('batch-sell deep link route', () => {
  it('uses original query parameters in the QR deeplink', () => {
    expect(batchSell.handlerSearchParams).toBe('original');
  });

  it('opens the default route with QR modal params for the batch sell deeplink', () => {
    const params = new URLSearchParams();

    const destination = batchSell.handler(params);

    expect(destination).toHaveProperty('path');
    expect((destination as { path: string }).path).toBe(DEFAULT_ROUTE);
    expect(
      (destination as { query: URLSearchParams }).query.get(
        HomeQueryParams.BatchSellDeeplinkUrl,
      ),
    ).toBe('https://link.metamask.io/batch-sell');
  });
});
