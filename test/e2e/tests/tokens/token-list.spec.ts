import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Context } from 'mocha';
import { zeroAddress } from 'ethereumjs-util';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import FixtureBuilder from '../../fixture-builder';
import {
  clickNestedButton,
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import AssetListPage from '../../page-objects/pages/home/asset-list';

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

  const mockEmptyPrices = async (mockServer: Mockttp, chainIdToMock: string) => {
    return mockServer
      .forGet(
        `https://price.api.cx.metamask.io/v2/chains/${parseInt(
          chainIdToMock,
          16,
        )}/spot-prices`,
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      }));
  };

  const mockEmptyHistoricalPrices = async (mockServer: Mockttp, address: string) => {
    return mockServer
      .forGet(
        `https://price.api.cx.metamask.io/v1/chains/${chainId}/historical-prices/${address}`,
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      }));
  };

  const mockSpotPrices = async (
    mockServer: Mockttp,
    chainIdToMock: string,
    prices: Record<string, any>
  ) => {
    return mockServer
      .forGet(
        `https://price.api.cx.metamask.io/v2/chains/${parseInt(
          chainIdToMock,
          16,
        )}/spot-prices`,
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: prices,
      }));
  };

  const mockHistoricalPrices = async (
    mockServer: Mockttp,
    address: string,
    price: number
  ) => {
    return mockServer
      .forGet(
        `https://price.api.cx.metamask.io/v1/chains/${chainId}/historical-prices/${toChecksumHexAddress(
          address,
        )}`,
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          prices: [
            [1717566000000, price * 0.9],
            [1717566322300, price],
            [1717566611338, price * 1.1],
          ],
        },
      }));
  };

  it('should not show percentage increase for an ERC20 token without prices available', async function () {
    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockEmptyPrices(mockServer, chainId),
          await mockEmptyPrices(mockServer, lineaChainId),
          await mockEmptyHistoricalPrices(mockServer, tokenAddress),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);

        await homePage.check_pageIsLoaded();
        await assetListPage.importCustomToken(tokenAddress, symbol);

        const percentageNative = await assetListPage.getAssetPercentageIncreaseDecrease(zeroAddress());
        assert.equal(percentageNative, '');

        const percentage = await assetListPage.getAssetPercentageIncreaseDecrease(tokenAddress);
        assert.equal(percentage, '');
      },
    );
  });

  it('shows percentage increase for an ERC20 token with prices available', async function () {
    const ethConversionInUsd = 10000;
    const marketData = { price: 0.123, marketCap: 12, pricePercentChange1d: 0.05 };
    const marketDataNative = { price: 0.123, marketCap: 12, pricePercentChange1d: 0.02 };

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
          await mockHistoricalPrices(mockServer, tokenAddress, marketData.price),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);

        await homePage.check_pageIsLoaded();
        await assetListPage.importCustomToken(tokenAddress, symbol);

        await assetListPage.check_tokenIncreasePercentage(zeroAddress(), '+0.02%');
        await assetListPage.check_tokenIncreasePercentage(tokenAddress, '+0.05%');
        await assetListPage.check_tokenIncreaseValue('+$50.00');
      },
    );
  });
});
