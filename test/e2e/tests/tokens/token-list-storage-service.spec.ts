import { Context } from 'mocha';
import { Mockttp } from 'mockttp';
import {
  CHAIN_IDS,
  MAINNET_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { login } from '../../page-objects/flows/login.flow';
import {
  mockCurrencyExchangeRates,
  mockFiatExchangeRates,
  mockPriceApiSupportedNetworks,
  mockSupportedVsCurrencies,
} from '../btc/mocks/price-api';
import { mockTokensV2SupportedNetworks } from '../btc/mocks/tokens-api';

describe('Token List via StorageService', function () {
  const chainId = CHAIN_IDS.MAINNET;
  const tokenAddress = '0x0994206dfe8de6ec6920ff4d779b0d950605fb53';
  const tokenName = 'Musical Token';
  const tokenSymbol = 'MSCL';
  const mUsdAddress = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';

  const tokenListData = {
    [tokenAddress]: {
      address: tokenAddress,
      aggregators: ['CoinGecko', 'Uniswap'],
      decimals: 18,
      iconUrl: `https://static.cx.metamask.io/api/v1/tokenIcons/1/${tokenAddress}.png`,
      name: tokenName,
      occurrences: 2,
      symbol: tokenSymbol,
    },
  };

  it('displays a token in the asset list injected via StorageService', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
          .withEnabledNetworks({ eip155: { [chainId]: true } })
          .withTokenListControllerStorageServiceData([
            { chainId, data: tokenListData },
          ])
          .build(),
        localNodeOptions: {
          chainId: parseInt(chainId, 16),
        },
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => [
          // Price API
          await mockCurrencyExchangeRates(mockServer),
          await mockFiatExchangeRates(mockServer),
          await mockSupportedVsCurrencies(mockServer),
          await mockPriceApiSupportedNetworks(mockServer),
          // Price API – /v3/spot-prices
          await mockServer
            .forGet(/https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
            .always()
            .thenCallback((request) => {
              const url = new URL(request.url);
              const assetIds = url.searchParams.getAll('assetIds').join(',');

              const response: Record<string, unknown> = {};

              if (assetIds.includes('eip155:1/slip44:60')) {
                response['eip155:1/slip44:60'] = {
                  id: 'ethereum',
                  price: 2500,
                  marketCap: 301000000000,
                  allTimeHigh: 4878.26,
                  allTimeLow: 0.43,
                  totalVolume: 15000000000,
                  high1d: 2550,
                  low1d: 2450,
                  circulatingSupply: 120686604,
                  dilutedMarketCap: 301000000000,
                  marketCapPercentChange1d: 1.2,
                  priceChange1d: 30,
                  pricePercentChange1h: 0.5,
                  pricePercentChange1d: 1.2,
                  pricePercentChange7d: 3.5,
                  pricePercentChange14d: -1.2,
                  pricePercentChange30d: 5.0,
                  pricePercentChange200d: -20.0,
                  pricePercentChange1y: 10.0,
                };
              }

              if (assetIds.includes(tokenAddress)) {
                response[`eip155:1/erc20:${tokenAddress}`] = null;
              }

              if (assetIds.includes(mUsdAddress)) {
                response[`eip155:1/erc20:${mUsdAddress}`] = {
                  id: 'musd',
                  price: 1.0,
                  marketCap: 50000000,
                  allTimeHigh: 1.05,
                  allTimeLow: 0.95,
                  totalVolume: 5000000,
                  high1d: 1.01,
                  low1d: 0.99,
                  circulatingSupply: 50000000,
                  dilutedMarketCap: 50000000,
                  marketCapPercentChange1d: 0,
                  priceChange1d: 0,
                  pricePercentChange1h: 0,
                  pricePercentChange1d: 0,
                  pricePercentChange7d: 0,
                  pricePercentChange14d: 0,
                  pricePercentChange30d: 0,
                  pricePercentChange200d: 0,
                  pricePercentChange1y: 0,
                };
              }

              return { statusCode: 200, json: response };
            }),
          // Tokens API – supported networks
          await mockTokensV2SupportedNetworks(mockServer),
          // Tokens API – /v3/assets (ETH mainnet + MSCL + mUSD)
          await mockServer
            .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
            .always()
            .thenCallback((request) => {
              const url = new URL(request.url);
              const assetIds = url.searchParams.getAll('assetIds').join(',');

              const results = [];

              if (assetIds.includes('eip155:1')) {
                results.push({
                  assetId: 'eip155:1/slip44:60',
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                });
              }

              if (assetIds.includes('eip155:1337')) {
                results.push({
                  assetId: 'eip155:1337/slip44:1',
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                });
              }

              if (assetIds.includes(tokenAddress)) {
                results.push({
                  assetId: `eip155:1/erc20:${tokenAddress}`,
                  name: tokenName,
                  symbol: tokenSymbol,
                  decimals: 18,
                });
              }

              if (assetIds.includes(mUsdAddress)) {
                results.push({
                  assetId: `eip155:1/erc20:${mUsdAddress}`,
                  name: 'mUSD',
                  symbol: 'MUSD',
                  decimals: 6,
                });
              }

              return { statusCode: 200, json: results };
            }),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const assetListPage = new AssetListPage(driver);

        await assetListPage.importTokenBySearch({
          tokenName,
          networkName: MAINNET_DISPLAY_NAME,
        });
        await assetListPage.checkTokenExistsInList(tokenName);
      },
    );
  });
});
