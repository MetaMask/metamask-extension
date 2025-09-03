import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_CONVERSION_RATE } from '../../../constants';

const PRICE_API_URL = 'https://price.api.cx.metamask.io';

export const mockExchangeRates = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v1/spot-prices/bitcoin`)
    .withQuery({
      vsCurrency: 'usd',
    })
    .thenJson(200, {
      id: 'bitcoin',
      price: DEFAULT_BTC_CONVERSION_RATE,
      marketCap: 2122611097491,
      allTimeHigh: 111814,
      allTimeLow: 67.81,
      totalVolume: 23418768890,
      high1d: 107194,
      low1d: 104627,
      circulatingSupply: 19878000,
      dilutedMarketCap: 2122611097491,
      marketCapPercentChange1d: 1.53806,
      priceChange1d: 1640.56,
      pricePercentChange1h: 0.11465406674330914,
      pricePercentChange1d: 1.5606119284420965,
      pricePercentChange7d: -0.8717128913812461,
      pricePercentChange14d: 2.5465747273699764,
      pricePercentChange30d: 3.646755873483935,
      pricePercentChange200d: 11.815056854214658,
      pricePercentChange1y: 60.63402236794521,
    });
