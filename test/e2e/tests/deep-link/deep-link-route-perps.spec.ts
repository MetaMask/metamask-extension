import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
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

describe('Deep Link - /perps Route', function () {
  const scenarios = generateScenariosForRoutes(['/perps']);

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
          console.log('Navigating to initial page');
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          console.log('Checking if login page is loaded');
          await loginPage.checkPageIsLoaded();

          if (locked === 'unlocked') {
            console.log('Logging in to homepage (unlocked scenario)');
            await loginPage.loginToHomepage();

            console.log('Checking if home page is loaded (unlocked scenario)');
            const homePage = new HomePage(driver);
            await homePage.checkPageIsLoaded();
          }

          const preparedUrl = await prepareDeepLinkUrl({
            route,
            signed,
            privateKey: keyPair.privateKey,
          });

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
