import { Mockttp } from 'mockttp';
import { TronNode } from '../../../seeder/tron/node';

const PRICE_API_URL = 'https://tokens.api.cx.metamask.io';

export const mockTokens = (
  mockServer: Mockttp,
  tronNode?: Pick<TronNode, 'trc20Tokens'>,
) => {
  const usdtToken = tronNode?.trc20Tokens.USDT ?? {
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    decimals: 6,
    name: 'Tether',
    symbol: 'USDT',
  };

  return mockServer
    .forGet(`${PRICE_API_URL}/v3/assets`)
    .always()
    .thenJson(200, [
      {
        assetId: `tron:728126428/trc20:${usdtToken.address}`,
        decimals: usdtToken.decimals,
        name: usdtToken.name,
        symbol: usdtToken.symbol,
      },
    ]);
};

export const mockMainnetTokens = (mockServer: Mockttp) =>
  mockServer
    .forGet(`${PRICE_API_URL}/v3/assets`)
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
