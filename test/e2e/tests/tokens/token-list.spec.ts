import { Mockttp } from 'mockttp';
import { Context } from 'mocha';
import { zeroAddress } from 'ethereumjs-util';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import {
  mockEmptyHistoricalPrices,
  mockEmptyPrices,
  mockHistoricalPrices,
  mockSpotPrices,
} from './utils/mocks';

describe('Token List', function () {
  const chainId = CHAIN_IDS.MAINNET;
  const lineaChainId = CHAIN_IDS.LINEA_MAINNET;
  const tokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
  const symbol = 'foo';

  const fixtures = {
    fixtures: new FixtureBuilder({ inputChainId: chainId }).build(),
    ganacheOptions: {
      ...defaultGanacheOptions,
      chainId: parseInt(chainId, 16),
    },
  };

  it('should not show percentage increase for an ERC20 token without prices available', async function () {
    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockEmptyPrices(mockServer, chainId),
          await mockEmptyPrices(mockServer, lineaChainId),
          await mockEmptyHistoricalPrices(mockServer, tokenAddress, chainId),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);

        await homePage.check_pageIsLoaded();
        await assetListPage.importCustomToken(tokenAddress, symbol);

        await assetListPage.check_tokenGeneralChangePercentageNotPresent(
          zeroAddress(),
        );
        await assetListPage.check_tokenGeneralChangePercentageNotPresent(
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
          await mockSpotPrices(mockServer, chainId, {
            [zeroAddress()]: marketDataNative,
            [tokenAddress.toLowerCase()]: marketData,
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
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);

        await homePage.check_pageIsLoaded();
        await assetListPage.importCustomToken(tokenAddress, symbol);

        await assetListPage.check_tokenGeneralChangePercentage(
          zeroAddress(),
          '+0.02%',
        );
        await assetListPage.check_tokenGeneralChangePercentage(
          tokenAddress,
          '+0.05%',
        );
        await assetListPage.check_tokenGeneralChangeValue('+$50.00');
      },
    );
  });
});
