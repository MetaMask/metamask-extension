import { Driver } from '../webdriver/driver';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
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
        const snapInstall = new SnapInstall(driver);
        const headerNavbar = new HeaderNavbar(driver);

        // navigate to test snaps page and connect to client status snap
        await testSnaps.openPage();

        // scroll to and click connect to client-status snap
        await testSnaps.scrollToConnectClientStatus();
        await testSnaps.clickConnectClientStatus();

        // switch to metamask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // click connect
        await snapInstall.check_pageIsLoaded();
        await snapInstall.clickNextButton();

        // click confirm
        await snapInstall.clickNextButton();

        // click ok
        await snapInstall.clickNextButton();

        // click send inputs on test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_pageIsLoaded();

        // click on submit
        await testSnaps.clickSubmitClientStatus();

        // validate the client status is false when the wallet is unlocked
        await testSnaps.check_clientStatus('false');

        // switch to the original MM tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // click on the three dot menu in header bar
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.openThreeDotMenu();

        // click on the lock MetaMask
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
