import { Suite } from 'mocha';
import { withFixtures, logInWithBalanceValidation } from '../../helpers';
import { Ganache } from '../../seeder/ganache';
import { Driver } from '../../webdriver/driver';
import GanacheContractAddressRegistry from '../../seeder/ganache-contract-address-registry';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';

describe('Click bridge button @no-mmi', function (this: Suite) {
  it('loads portfolio tab from wallet overview when flag is turned off', async function () {
    await withFixtures(
      getBridgeFixtures(this.test?.fullTitle()),
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
      }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);
        await bridgePage.navigateToBridgePage();
        await bridgePage.verifyPortfolioTab(2);
      },
    );
  });

  it('loads portfolio tab from asset overview when flag is turned off', async function () {
    await withFixtures(
      // withErc20 param is false, as we test it manually below
      getBridgeFixtures(this.test?.fullTitle(), undefined, false),
      async ({
        driver,
        ganacheServer,
        contractRegistry,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
        contractRegistry: GanacheContractAddressRegistry;
      }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);

        // ETH
        await bridgePage.navigateToAssetPage(contractRegistry, 'ETH', false);
        await bridgePage.navigateToBridgePage('coin-overview');
        await bridgePage.verifyPortfolioTab(2);

        await bridgePage.reloadHome();

        // TST
        await bridgePage.navigateToAssetPage(contractRegistry, 'TST');
        await bridgePage.navigateToBridgePage('token-overview');
        await bridgePage.verifyPortfolioTab(3);
      },
    );
  });
});
