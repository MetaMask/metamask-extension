import { withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilder from '../fixture-builder';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import DeepLink from '../page-objects/pages/deep-link';

describe('Deep Link', function () {
  it('Displays the deeplink page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // navigate to http://link.metamask.io/home
        // make sure it redirects to the deeplink page internally
        await driver.openNewURL('http://link.metamask.io/home');
        // wait for the window title to change to the fullscreen url
        const deepLink = new DeepLink(driver);
        await deepLink.check_deepLinkPageIsLoaded();
        await deepLink.clickContinueButton();
        await loginWithBalanceValidation(driver);
      },
    );
  });
});
