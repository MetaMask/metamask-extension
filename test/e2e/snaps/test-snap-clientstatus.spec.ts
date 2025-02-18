import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES } from '../helpers';

describe('Test Snap Client Status', function () {
  it('can properly show client status locked state', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const headerNavbar = new HeaderNavbar(driver);

        // navigate to test snaps page and connect to client status snap
        await testSnaps.openPage();

        // scroll to and click connect to client-status snap
        await testSnaps.scrollToConnectClientStatus();
        await testSnaps.clickConnectClientStatus();
        await testSnaps.completeSnapInstallConfirmation();

        // click on submit
        await testSnaps.clickSubmitClientStatus();

        // validate the client status is false when the wallet is unlocked
        await testSnaps.check_clientStatus('false');

        // switch to the original MM tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await headerNavbar.check_pageIsLoaded();

        // click on the three dot menu in header bar and lock MetaMask
        await headerNavbar.lockMetaMask();

        // click send inputs on test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_pageIsLoaded();

        // click on submit
        await testSnaps.clickSubmitClientStatus();

        // validate the client status is true when the wallet is locked
        await testSnaps.check_clientStatus('true');
      },
    );
  });
});
