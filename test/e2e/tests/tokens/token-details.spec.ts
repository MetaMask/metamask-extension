import { Mockttp } from 'mockttp';
import { Context } from 'mocha';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { formatCurrency } from '../../../../ui/helpers/utils/confirm-tx.util';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  mockEmptyHistoricalPrices,
  mockEmptyPrices,
  mockHistoricalPrices,
  mockSpotPrices,
} from './utils/mocks';

describe('Token Details', function () {
  const chainId = CHAIN_IDS.MAINNET;
  const tokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
  const symbol = 'foo';

  const fixtures = {
    fixtures: new FixtureBuilder({ inputChainId: chainId }).build(),
    localNodeOptions: {
      chainId: parseInt(chainId, 16),
    },
  };

  it('shows details for an ERC20 token without prices available', async function () {
    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockEmptyPrices(mockServer, chainId),
          await mockEmptyHistoricalPrices(mockServer, tokenAddress, chainId),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await homePage.check_pageIsLoaded();
        await assetListPage.importCustomTokenByChain(
          chainId,
          tokenAddress,
          symbol,
        );
        await assetListPage.dismissTokenImportedMessage();
        await assetListPage.openTokenDetails(symbol);
        await assetListPage.check_tokenSymbolAndAddressDetails(
          symbol,
          tokenAddress,
        );
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

    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
        ethConversionInUsd,
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockSpotPrices(mockServer, chainId, {
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
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);
        await homePage.check_pageIsLoaded();
        await assetListPage.importCustomTokenByChain(
          chainId,
          tokenAddress,
          symbol,
        );
        await assetListPage.dismissTokenImportedMessage();
        await assetListPage.openTokenDetails(symbol);
        await assetListPage.check_tokenSymbolAndAddressDetails(
          symbol,
          tokenAddress,
        );

        const expectedPrice = formatCurrency(
          `${marketData.price * ethConversionInUsd}`,
          'USD',
        );
        const expectedMarketCap = `${
          marketData.marketCap * ethConversionInUsd
        }.00`;

        await assetListPage.check_tokenPriceAndMarketCap(
          expectedPrice,
          expectedMarketCap,
        );

        await assetListPage.check_priceChartIsShown();
      },
    );
  });
});
