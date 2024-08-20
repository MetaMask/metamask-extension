import { Suite } from 'mocha';
import { logInWithBalanceValidation, withFixtures } from '../../helpers';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';

describe('Click bridge button @no-mmi', function (this: Suite) {
  it('loads portfolio tab from wallet overview when flag is turned off', async function () {
    await withFixtures(
      getBridgeFixtures(this.test?.fullTitle()),
      async ({ driver, ganacheServer }) => {
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
      async ({ driver, ganacheServer, contractRegistry }) => {
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
