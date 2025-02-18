import { Driver } from '../webdriver/driver';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES } from '../helpers';

describe('Test Snap TxInsights', function () {
  it('tests tx insights functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        // navigate to test snaps page and connect
        await testSnaps.openPage();

        // scroll and click to the transaction-insights test snap
        await testSnaps.scrollToTransactionInsight();
        await testSnaps.clickTransactionInsight();

        await testSnaps.completeSnapInstallConfirmation();

        // click get accounts
        await testSnaps.clickGetAccountButton();

        // switch back to MetaMask window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // click Connect
        await snapInstall.clickConnectButton();

        // switch to test-snaps page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // click send tx
        await testSnaps.clickSendInsightButton();

        // delay needed to wait for the transaction to be sent
        await driver.delay(2000);

        // switch back to MetaMask window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // validate the transaction insights title
        await snapInstall.validateTransactionInsightsTitle();

        // validate the transaction insights type
        await snapInstall.validateTransactionInsightsType();
      },
    );
  });
});
