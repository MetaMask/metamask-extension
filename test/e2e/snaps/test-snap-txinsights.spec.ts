import { Driver } from '../webdriver/driver';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES } from '../helpers';

describe('Test Snap TxInsights', function () {
  it(' validate the insights section appears', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        // Navigate to test snaps page and click to the transaction-insights test snap
        await testSnaps.openPage();
        await testSnaps.clickTransactionInsightButton();
        await testSnaps.completeSnapInstallConfirmation();

        // Click get accounts and connect to the snap
        await testSnaps.clickGetAccountButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.clickConnectButton();

        // Switch to test snaps page and click send transaction
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.clickSendInsightButton();
        await driver.delay(2000); // Delay needed to wait for the transaction to be sent

        // Switch back to MetaMask dialog and validate the transaction insights title and type
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.check_transactionInsightsTitle();
        await snapInstall.check_transactionInsightsType();
      },
    );
  });
});
