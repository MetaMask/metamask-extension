import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { switchToNetworkFlow } from '../page-objects/flows/network.flow';
import HomePage from '../page-objects/pages/home/homepage';
import SendTokenPage from '../page-objects/pages/send/send-token-page';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import { completeSnapInstallConfirmation } from '../page-objects/flows/snap-permission.flow';

describe('Name lookup', function () {
  it('validate the recipient address appears in the send flow', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const homePage = new HomePage(driver);
        const sendTokenPage = new SendTokenPage(driver);

        // Open a new tab and navigate to test snaps page and click name lookup
        await testSnaps.openPage();
        await testSnaps.clickNameLookupButton();
        await completeSnapInstallConfirmation(driver);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        // Navigate to the extension home page and validate the recipient address in the send flow
        await switchToNetworkFlow(driver, 'Ethereum Mainnet');
        await homePage.startSendFlow();
        await sendTokenPage.check_pageIsLoaded();
        await sendTokenPage.fillRecipient('metamask.domain');
        await sendTokenPage.check_ensAddressResolution(
          'metamask.domain',
          '0xc0ff...4979',
        );
      },
    );
  });
});
