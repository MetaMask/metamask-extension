import { Suite } from 'mocha';
import { logInWithBalanceValidation, withFixtures } from '../../helpers';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';

describe('Click bridge button', function (this: Suite) {
  it('loads portfolio tab from wallet overview when flag is turned off', async function () {
    await withFixtures(
      getBridgeFixtures(this.test?.fullTitle()),
      async ({ driver }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver);
        await bridgePage.navigateToBridgePage();
        await bridgePage.verifyPortfolioTab();
      },
    );
  });

  it('loads portfolio tab from asset overview when flag is turned off', async function () {
    await withFixtures(
      getBridgeFixtures(this.test?.fullTitle(), undefined, true),
      async ({ driver }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver);

        // ETH
        await bridgePage.navigateToAssetPage('ETH');
        await bridgePage.navigateToBridgePage('coin-overview');
        await bridgePage.verifyPortfolioTab();

        await bridgePage.reloadHome();

        // TST
        await bridgePage.navigateToAssetPage('TST');
        await bridgePage.navigateToBridgePage('token-overview');
        await bridgePage.verifyPortfolioTab();
      },
    );
  });
});
