import assert from 'node:assert/strict';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import DeepLink from '../../page-objects/pages/deep-link-page';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  bytesToB64,
  generateECDSAKeyPair,
  generateScenariosForRoutes
} from './helpers';
import {
  getConfig,
  prepareDeepLinkUrl,
  shouldRenderCheckbox,
} from './deep-link-helpers';

describe('Deep Link - Invalid Route', function () {
  const scenarios = generateScenariosForRoutes(['/INVALID']);

  scenarios.forEach(({ locked, signed, route, action }) => {
    it(`handles ${locked} and ${signed} ${route} deep link with ${action} action`, async function () {
      const keyPair = await generateECDSAKeyPair();
      const deepLinkPublicKey = bytesToB64(
        await crypto.subtle.exportKey('raw', keyPair.publicKey),
      );

      await withFixtures(
        await getConfig({
          title: this.test?.fullTitle(),
          deepLinkPublicKey,
        }),
        async ({ driver }: { driver: Driver }) => {
          const isSigned = shouldRenderCheckbox(signed);

          // ensure the background is ready to process deep links (by waiting
          // for the UI to load)
          console.log('Navigating to initial page');
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          console.log('Checking if login page is loaded');
          await loginPage.checkPageIsLoaded();

          // if `locked` is set to "unlocked", we need to log in _now_, so the
          // deep link's `continue` button is able to can skip the lock screen.
          if (locked === 'unlocked') {
            console.log('Logging in to homepage (unlocked scenario)');
            await loginPage.loginToHomepage();

            console.log('Checking if home page is loaded (unlocked scenario)');
            const homePage = new HomePage(driver);
            await homePage.checkPageIsLoaded();
          }

          // navigate to the route and make sure it
          // redirects to the deep link interstitial page
          // note: we sign the "/INVALID" link as well, as signed links that no
          // longer exist/match should be handled the same way as
          // unsigned links. We test for this below.
          const preparedUrl = await prepareDeepLinkUrl({
            route,
            signed,
            privateKey: keyPair.privateKey,
          });

          console.log('Opening deep link URL');
          await driver.openNewURL(preparedUrl);

          const deepLink = new DeepLink(driver);
          console.log('Checking if deep link page is loaded');
          await deepLink.checkPageIsLoaded();

          // we should NOT render the checkbox for invalid routes
          console.log('Checking if deep link interstitial checkbox exists');
          const hasCheckbox =
            await deepLink.hasSkipDeepLinkInterstitialCheckBox();
          assert.equal(hasCheckbox, false, 'Checkbox presence mismatch');

          console.log('Getting error text for invalid route');
          const text = await deepLink.getDescriptionText();
          assert.equal(
            text,
            `We can't find the page you are looking for.${
              isSigned
                ? `
Update to the latest version of MetaMask
and we'll take you to the right place.`
                : ''
            }`,
          );

          console.log('Clicking continue button');
          await deepLink.clickContinueButton();
          if (locked === 'locked') {
            console.log('Checking if login page is loaded (locked scenario)');
            await loginPage.checkPageIsLoaded();
            console.log('Logging in to homepage (locked scenario)');
            await loginPage.loginToHomepage();
          }

          // invalid routes redirect to home page
          const homePage = new HomePage(driver);
          console.log('Checking if target page is loaded');
          await homePage.checkPageIsLoaded();
        },
      );
    });
  });
});
