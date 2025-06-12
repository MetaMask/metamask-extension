import { Driver } from '../webdriver/driver';
import HomePage from '../page-objects/pages/home/homepage';
import SendTokenPage from '../page-objects/pages/send/send-token-page';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockLookupSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { switchToNetworkFromSendFlow } from '../page-objects/flows/network.flow';

describe('Name lookup', function () {
  it('validate the recipient address appears in the send flow', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockLookupSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const sendTokenPage = new SendTokenPage(driver);

        // Open a new tab and navigate to test snaps page and click name lookup
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNameLookUpButton',
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        // Navigate to the extension home page and validate the recipient address in the send flow
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await homePage.startSendFlow();
        await sendTokenPage.check_pageIsLoaded();
        await sendTokenPage.fillRecipient('metamask.domain');
        await sendTokenPage.check_ensAddressResolution(
          'metamask.domain',
          '0xc0ffe...54979',
        );
      },
    );
  });
});
