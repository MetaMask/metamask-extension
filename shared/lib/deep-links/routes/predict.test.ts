// eslint-disable-next-line import-x/no-restricted-paths -- Preserve the existing dependency exposed by removing its barrel.
import { DEFAULT_ROUTE } from '../../../../ui/helpers/constants/routes';
import { predict } from './predict';
import { HomeQueryParams } from './home';

describe('predict deep link route', () => {
  it('opens the default route with QR modal params and includes query parameters in the encoded deeplink', () => {
    const params = new URLSearchParams('marketId=30615');

    const destination = predict.handler(params);

    expect(destination).toHaveProperty('path');
    expect((destination as { path: string }).path).toBe(DEFAULT_ROUTE);
    expect(
      (destination as { query: URLSearchParams }).query.get(
        HomeQueryParams.PredictDeeplinkUrl,
      ),
    ).toBe('https://link.metamask.io/predict?marketId=30615');
  });
});
