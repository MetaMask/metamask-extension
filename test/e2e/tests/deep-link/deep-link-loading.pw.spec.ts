import { test as pwTest } from '@playwright/test';
import { E2E_DRIVER } from '../../constants';
import DeepLink from '../../page-objects/pages/deep-link-page';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import { withFixtures } from '../../helpers';
import {
  bytesToB64,
  generateECDSAKeyPair,
  getConfig,
  signDeepLink,
} from './helpers';

const SIMULATED_VERIFICATION_DELAY = 30_000;

pwTest.describe('Deep Link - Loading Redirect', () => {
  pwTest(
    'opens the extension loading route while verification is pending',
    async (
      // eslint-disable-next-line no-empty-pattern
      {},
      testInfo,
    ) => {
      const keyPair = await generateECDSAKeyPair();
      const deepLinkPublicKey = bytesToB64(
        await crypto.subtle.exportKey('raw', keyPair.publicKey),
      );
      const config = await getConfig({
        title: testInfo.titlePath.join(' '),
        deepLinkPublicKey,
        manifestFlags: {
          testing: {
            simulatedDeepLinkVerificationDelay: SIMULATED_VERIFICATION_DELAY,
          },
        },
      });

      await withFixtures(
        {
          ...config,
          driverType: E2E_DRIVER.PLAYWRIGHT,
        },
        async ({ driver }) => {
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          await loginPage.checkPageIsLoaded();
          await loginPage.loginToHomepage();
          await new HomePage(driver).checkPageIsLoaded();

          const signedUrl = await signDeepLink(
            keyPair.privateKey,
            'https://link.metamask.io/home',
          );

          // Firefox cancels the intercepted public navigation after the
          // synchronous tabs.update starts loading the extension page. The
          // resulting NS_ERROR_ABORT is expected; the loading page below is
          // the authoritative outcome.
          const navigationPromise = driver
            .openNewURL(signedUrl)
            .catch(() => undefined);
          await new DeepLink(driver).checkLoadingPageWasOpened(signedUrl);
          await navigationPromise;
        },
      );
    },
  );
});
