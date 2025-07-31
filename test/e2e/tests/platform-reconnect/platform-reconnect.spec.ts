import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE } from '../../constants';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';

describe('Platform Reconnect', function (this: Suite) {
  it('should maintain UI functionality after service worker is stopped', async function () {
    // Skip this test for MV2 builds since service workers only exist in MV3
    if (!isManifestV3) {
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        // ignore errors with "Premature close"
        ignoredConsoleErrors: ['Premature close'],
      },
      async ({
        driver,
        extensionId,
      }: {
        driver: Driver;
        extensionId: string;
      }) => {
        // Step 1: Login to MetaMask
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();

        // Step 2: Open chrome://serviceworker-internals/ in a new tab
        await driver.openNewPage('chrome://serviceworker-internals/');

        // Step 3: Find and stop the MetaMask service worker
        await driver.waitForSelector('body');

        // Find the service worker entry for our extension
        const serviceWorkerOrigin = `chrome-extension://${extensionId}`;
        console.log(
          `Looking for service worker with origin: ${serviceWorkerOrigin}`,
        );

        // Wait for the service worker entry to be visible
        await driver.waitForSelector('.serviceworker-item');

        // Find the service worker item that contains our extension's origin
        const stopServiceWorker = await driver.executeScript(`
          const serviceWorkerItems = document.querySelectorAll('.serviceworker-item');

          for (const item of serviceWorkerItems) {
            const originText = item.textContent || '';
            if (originText.includes('${serviceWorkerOrigin}')) {
              // Find the Stop button within this service worker item
              const stopButton = item.querySelector('button.stop');
              if (stopButton) {
                stopButton.click();
                // stopping will change the button to style.display === 'hidden'
                // we wait until it is back before proceeding further
                return new Promise((resolve) => {
                  const checkStopButton = setInterval(() => {
                    if (stopButton.style.display === 'none') {
                      clearInterval(checkStopButton);
                      resolve(true);
                    }
                  }, 100);
                });
                return true;
              }
            }
          }
          return false;
        `);

        assert(stopServiceWorker, 'Failed to find and stop the service worker');
        console.log('Service worker stopped successfully');

        // Wait 3 seconds for UI to re-initiate reconnection
        await driver.delay(3000);

        // Step 4: Switch back to MetaMask and wait for reconnection
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Step 5: Lock the wallet, then unlock it to ensure it reconnects
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.lockMetaMask();

        // Step 6: Unlock the wallet to verify reconnection works, as the unlock
        // process guarantees we'll communicate back with the service worker
        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginPage.loginToHomepage();

        // Verify we're back on the homepage after unlock
        await homePage.check_pageIsLoaded();
      },
    );
  });
});
