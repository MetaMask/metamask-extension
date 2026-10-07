// eslint-disable-next-line import-x/no-restricted-paths -- Preserve the existing dependency exposed by removing its barrel.
import { DEFAULT_ROUTE } from '../../../../ui/helpers/constants/routes';
import { batchSell } from './batch-sell';
import { HomeQueryParams } from './home';

describe('batch-sell deep link route', () => {
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
