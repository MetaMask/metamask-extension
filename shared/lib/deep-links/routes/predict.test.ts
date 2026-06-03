import { predict } from './predict';
import { HomeQueryParams } from './home';
import { DEFAULT_ROUTE } from './route';

describe('predict deep link route', () => {
  it('uses original query parameters in the QR deeplink', () => {
    expect(predict.handlerSearchParams).toBe('original');
  });

  it('opens the default route with QR modal params and preserves every query parameter in the encoded deeplink', () => {
    const params = new URLSearchParams(
      'marketId=30615&sig_params=marketId&sig=signature&utm_source=twitter&_hsenc=value&attributionId=attr',
    );

    const destination = predict.handler(params);

    expect(destination).toHaveProperty('path');
    expect((destination as { path: string }).path).toBe(DEFAULT_ROUTE);
    expect(
      (destination as { query: URLSearchParams }).query.get(
        HomeQueryParams.PredictDeeplinkUrl,
      ),
    ).toBe(
      'https://link.metamask.io/predict?marketId=30615&sig_params=marketId&sig=signature&utm_source=twitter&_hsenc=value&attributionId=attr',
    );
  });
});
