import { Mockttp } from 'mockttp';

const PRICE_API_URL = 'https://min-api.cryptocompare.com';

export const mockPriceMulti = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/data/pricemulti`)
    .withQuery({
      fsyms: 'btc',
    })
    .thenJson(200, {
      BTC: {
        USD: 109784.68,
      },
      SOL: {
        USD: 154.82,
      },
    });

export const mockPriceMultiBtcAndSol = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/data/pricemulti`)
    .withQuery({
      fsyms: 'btc,sol',
    })
    .thenJson(200, {
      BTC: {
        USD: 109784.68,
      },
      SOL: {
        USD: 154.82,
      },
    });
