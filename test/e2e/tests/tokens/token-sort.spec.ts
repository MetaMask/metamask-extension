import { Context } from 'mocha';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, largeDelayMs } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Token List Sorting', function () {
  const mainnetChainId = CHAIN_IDS.MAINNET;
  const customTokenAddress = '0x2EFA2Cb29C2341d8E5Ba7D3262C9e9d6f1Bf3711';
  const customTokenSymbol = 'ABC';

  const testFixtures = {
    fixtures: new FixtureBuilder({ inputChainId: mainnetChainId }).build(),
    localNodeOptions: {
      chainId: parseInt(mainnetChainId, 16),
    },
  };

  it('should sort tokens alphabetically and by decreasing balance', async function () {
    await withFixtures(
      {
        ...testFixtures,
        title: (this as Context).test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);

        await homePage.check_pageIsLoaded();
        await assetListPage.importCustomTokenByChain(
          CHAIN_IDS.MAINNET,
          customTokenAddress,
          customTokenSymbol,
        );

        await assetListPage.check_tokenExistsInList('Ethereum');
        await assetListPage.sortTokenList('alphabetically');

        await driver.waitUntil(
          async () => {
            const sortedTokenList = await assetListPage.getTokenListNames();
            return sortedTokenList[0].includes(customTokenSymbol);
          },
          { timeout: largeDelayMs, interval: 100 },
        );

        await assetListPage.sortTokenList('decliningBalance');
        await driver.waitUntil(
          async () => {
            const sortedTokenListByBalance =
              await assetListPage.getTokenListNames();
            return sortedTokenListByBalance[0].includes('Ethereum');
          },
          { timeout: largeDelayMs, interval: 100 },
        );
      },
    );
  });
});
