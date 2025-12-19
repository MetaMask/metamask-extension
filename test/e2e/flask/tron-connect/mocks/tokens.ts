import { Mockttp } from 'mockttp';

const PRICE_API_URL = 'https://tokens.api.cx.metamask.io';

export const mockTokens = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v3/assets`)
    .withQuery({
      assetIds: 'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    })
    .thenJson(200, [
      {
        assetId: "tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        decimals: 6,
        name: "Tether",
        symbol: "USDT"
      }
    ]);