import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import {
  bytesToB64,
  generateECDSAKeyPair,
  generateScenariosForRoutes,
  getConfig,
  prepareDeepLinkUrl,
  shouldRenderCheckbox,
} from './helpers';

describe('Deep Link - /home Route', function () {
  // These require the actual webRequest redirect and interstitial → UI document
  // boundary; parser/eligibility variants are covered by colocated unit tests.
  for (const code of ['ABC123', 'INVALID-CODE']) {
    it(`preserves the warning and destination with Rewards Money disabled (${code})`, async function () {
      await withFixtures(
        await getConfig({
          title: this.test?.fullTitle(),
          manifestFlags: {
            remoteFeatureFlags: {
              rewardsMoneyControllerEnabled: {
                enabled: false,
                minimumVersion: '0.0.0',
              },
            },
          },
        }),
        async ({ driver }: { driver: Driver }) => {
          await driver.navigate();
          const login = new LoginPage(driver);
          await login.checkPageIsLoaded();
          await navigateDeepLinkToDestination(
            driver,
            `https://link.metamask.io/home?ref=${code}`,
            'locked',
            false,
            HomePage,
          );
        },
      );
    });
  }

  const scenarios = generateScenariosForRoutes(['/home']);

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
          const preparedUrl = await prepareDeepLinkUrl({
            route,
            signed,
            privateKey: keyPair.privateKey,
          });

          // Navigate through deep link interstitial, complete login if locked,
          // and verify the home page has been loaded!
          await navigateDeepLinkToDestination(
            driver,
            preparedUrl,
            locked,
            shouldRenderCheckbox(signed),
            HomePage,
          );
        },
      );
    });
  });
});
