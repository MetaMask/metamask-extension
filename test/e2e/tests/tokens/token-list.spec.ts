import { Mockttp } from 'mockttp';
import { Context } from 'mocha';
import { zeroAddress } from 'ethereumjs-util';
import { CHAIN_IDS } from '../../../../shared/constants/network';
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
  mockHistoricalPrices,
  mockTokenMetadataApis,
  mockSpotPrices,
} from './utils/mocks';

describe('Token List', function () {
  const chainId = CHAIN_IDS.MAINNET;
  const tokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
  const symbol = 'foo';

  const fixtures = {
    fixtures: new FixtureBuilderV2()
      .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
      .withEnabledNetworks({ eip155: { [chainId]: true } })
      .build(),
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
    manifestFlags: {
      remoteFeatureFlags: {
        extensionUxTokenManagementFilter: true,
      },
    },
  };

  it('should not show percentage increase for an ERC20 token without prices available', async function () {
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

        await tokensTab.checkTokenGeneralChangePercentageNotPresent(
          zeroAddress(),
        );
        await tokensTab.checkTokenGeneralChangePercentageNotPresent(
          tokenAddress,
        );
      },
    );
  });
  it('shows percentage increase for an ERC20 token with prices available', async function () {
    const ethConversionInUsd = 10000;
    const marketData = {
      price: 0.123,
      marketCap: 12,
      pricePercentChange1d: 0.05,
    };
    const marketDataNative = {
      price: 0.123,
      marketCap: 12,
      pricePercentChange1d: 0.02,
    };

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
            'eip155:1/slip44:60': marketDataNative,
            [`eip155:1/erc20:${tokenAddress.toLowerCase()}`]: marketData,
          }),
          await mockHistoricalPrices(mockServer, {
            address: tokenAddress,
            chainId,
            historicalPrices: [
              { timestamp: 1717566000000, price: marketData.price * 0.9 },
              { timestamp: 1717566322300, price: marketData.price },
              { timestamp: 1717566611338, price: marketData.price * 1.1 },
            ],
          }),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);

        await homePage.checkPageIsLoaded();
        await tokensTab.checkTokenGeneralChangePercentage(
          zeroAddress(),
          '+0.02%',
        );
        await tokensTab.checkTokenGeneralChangePercentage(
          tokenAddress,
          '+0.05%',
        );
      },
    );
  });
});
