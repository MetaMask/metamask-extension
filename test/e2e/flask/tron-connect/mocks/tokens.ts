import { Mockttp } from 'mockttp';
import { tokensV3Assets } from '../../../mock-response-data/api-responses';

const PRICE_API_URL = 'https://tokens.api.cx.metamask.io';

export const mockTokens = (mockServer: Mockttp) =>
  tokensV3Assets
    .rule(mockServer)
    .always()
    .withQuery({
      assetIds: 'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    })
    .thenJson(200, [
      {
        assetId: 'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        decimals: 6,
        name: 'Tether',
        symbol: 'USDT',
      },
    ]);
