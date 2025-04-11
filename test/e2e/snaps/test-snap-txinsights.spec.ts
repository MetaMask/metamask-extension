import { Driver } from '../webdriver/driver';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { withFixtures, WINDOW_TITLES, openDapp } from '../helpers';
import TestDapp from '../page-objects/pages/test-dapp';

describe('Test Snap TxInsights', function () {
  it(' validate the insights section appears', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        const snapInstall = new SnapInstall(driver);

        // Navigate to test snaps page and click to the transaction-insights test snap
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectTransactionInsightButton',
        );

        // open the test-dapp page
        await openDapp(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // click send tx
        await testDapp.clickMaliciousERC20TransferButton();

        // Switch back to MetaMask dialog and validate the transaction insights title and type
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.check_transactionInsightsTitle();
        await snapInstall.check_transactionInsightsType();
      },
    );
  });
});
