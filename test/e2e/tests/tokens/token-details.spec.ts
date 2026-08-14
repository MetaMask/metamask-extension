import { Mockttp } from 'mockttp';
import { Context } from 'mocha';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { formatCurrency } from '../../../../ui/helpers/utils/confirm-tx.util';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { NETWORK_CLIENT_ID } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import { login } from '../../page-objects/flows/login.flow';
import {
  mockEmptyHistoricalPrices,
  mockEmptyPrices,
  mockHistoricalPricesV3,
  mockTokenMetadataApis,
  mockSpotPrices,
} from './utils/mocks';

describe('Token Details', function () {
  const chainId = CHAIN_IDS.MAINNET;
  const tokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
  const symbol = 'foo';

  const fixtures = {
    fixtures: new FixtureBuilderV2()
      .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
      .withEnabledNetworks({ eip155: { [chainId]: true } })
      .build(),
    manifestFlags: {
      remoteFeatureFlags: {
        extensionUxTokenManagementFilter: true,
      },
    },
    localNodeOptions: {
      chainId: parseInt(chainId, 16),
    },
    unifiedEvmAccountsApiBalances: {
      mainnetAdditionalBalances: [
        {
          assetId: `eip155:1/erc20:${tokenAddress.toLowerCase()}`,
          balance: '1',
        },
      ],
    },
  };

  it('shows details for an ERC20 token without prices available', async function () {
    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => [
          ...(await mockTokenMetadataApis(mockServer, [
            { address: tokenAddress, symbol, name: symbol, decimals: 18 },
          ])),
          await mockEmptyPrices(mockServer),
          await mockEmptyHistoricalPrices(mockServer, tokenAddress, chainId),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);
        await homePage.checkPageIsLoaded();
        await tokensTab.openTokenDetails(symbol);
        await tokensTab.checkTokenSymbolAndAddressDetails(symbol, tokenAddress);
      },
    );
  });

  it('shows details for an ERC20 token with prices available', async function () {
    const ethConversionInUsd = 10000;

    // Prices are in ETH
    const marketData = {
      price: 0.123,
      marketCap: 12,
    };

    const expectedPrice = formatCurrency(
      `${marketData.price * ethConversionInUsd}`,
      'USD',
    );

    const expectedMarketCap = '$120.00K';

    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
        ethConversionInUsd,
        testSpecificMock: async (mockServer: Mockttp) => [
          ...(await mockTokenMetadataApis(mockServer, [
            { address: tokenAddress, symbol, name: symbol, decimals: 18 },
          ])),
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: ethConversionInUsd,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
            [`eip155:1/erc20:${tokenAddress.toLowerCase()}`]: {
              price: marketData.price * ethConversionInUsd,
              marketCap: marketData.marketCap * ethConversionInUsd,
            },
          }),
          await mockHistoricalPricesV3(
            mockServer,
            'eip155:1',
            `erc20:${tokenAddress.toLowerCase()}`,
            [
              [1717566000000, marketData.price * 0.9],
              [1717566322300, marketData.price],
              [1717566611338, marketData.price * 1.1],
            ],
          ),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);
        await homePage.checkPageIsLoaded();
        await tokensTab.openTokenDetails(symbol);
        await tokensTab.checkTokenSymbolAndAddressDetails(symbol, tokenAddress);

        await tokensTab.checkTokenPriceAndMarketCap(
          expectedPrice,
          expectedMarketCap,
        );

        await tokensTab.checkPriceChartIsShown();
      },
    );
  });

  it('shows details for a N token with prices available', async function () {
    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
        // Native ETH price in the details view comes from the ETH conversion
        // rate (see useCurrentPrice), so seed it to match the asserted price.
        ethConversionInUsd: 1700,
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 1700,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          }),
          await mockHistoricalPricesV3(mockServer, 'eip155:1', 'slip44:60'),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const tokensTab = new TokensTab(driver);
        await tokensTab.openTokenDetails('Ethereum');

        // check display of price in details
        await tokensTab.checkTokenPrice('$1,700.00');
      },
    );
  });
});
