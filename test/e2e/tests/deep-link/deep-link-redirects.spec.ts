import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  bytesToB64,
  generateECDSAKeyPair,
  getConfig,
  prepareDeepLinkUrl,
  REDIRECT_ROUTES,
} from './helpers';

describe('Deep Link - External Redirects', function () {
  it('handles all external redirect routes (signed and unsigned)', async function () {
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
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        for (const { route, expectedUrl } of REDIRECT_ROUTES) {
          console.log(`Testing signed redirect for ${route}`);
          const signedUrl = await prepareDeepLinkUrl({
            route,
            signed: 'signed with sig_params',
            privateKey: keyPair.privateKey,
          });
          await driver.openNewURL(signedUrl);
          await driver.waitForUrl({ url: expectedUrl });

          await driver.navigate();
          await homePage.checkPageIsLoaded();

          console.log(`Testing unsigned redirect for ${route}`);
          const unsignedUrl = await prepareDeepLinkUrl({
            route,
            signed: 'unsigned',
          });
          await driver.openNewURL(unsignedUrl);
          await driver.waitForUrl({ url: expectedUrl });

          await driver.navigate();
          await homePage.checkPageIsLoaded();
        }
      },
    );
  });
});
