import { Mockttp } from 'mockttp';

const PRICE_API_URL = 'https://min-api.cryptocompare.com';

export const mockPriceMulti = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/data/pricemulti:728126428`)
    .withQuery({
      fsyms: 'trx',
    })
    .thenJson(200, {
      TRX: {
        USD: 0.2806,
      },
      SOL: {
        USD: 154.82,
      },
    });

export const mockPriceMultiTrxAndSol = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/data/pricemulti`)
    .withQuery({
      fsyms: 'trx,sol',
    })
    .thenJson(200, {
      TRX: {
        USD: 0.2806,
      },
      SOL: {
        USD: 154.82,
      },
    });
