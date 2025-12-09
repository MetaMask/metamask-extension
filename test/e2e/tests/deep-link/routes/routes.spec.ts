import { withFixtures } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import LoginPage from '../../../page-objects/pages/login-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import { BaseUrl } from '../../../../../shared/constants/urls';
import { bytesToB64, generateECDSAKeyPair, signDeepLink } from '../helpers';
import { getConfig as _getConfig } from '../helpers';
import RewardsPage from '../../../page-objects/pages/rewards/rewards-page';

describe('Deep Link', function () {
  let keyPair: CryptoKeyPair;
  let deepLinkPublicKey: string;

  function getConfig(title?: string) {
    return _getConfig(title ?? null, deepLinkPublicKey);
  }

  beforeEach(async function () {
    keyPair = await generateECDSAKeyPair();
    deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );
  });

  describe('Routes', function () {
    async function navigate(
      driver: Driver,
      rawUrl: string,
      test: () => Promise<void>,
    ) {
      await driver.navigate();
      const loginPage = new LoginPage(driver);
      await loginPage.checkPageIsLoaded();
      await loginPage.loginToHomepage();
      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();

      const signedUrl = await signDeepLink(keyPair.privateKey, rawUrl);

      // test signed flow
      await driver.openNewURL(signedUrl);

      await test();

      await driver.navigate();
      await homePage.checkPageIsLoaded();

      // test unsigned flow
      await driver.openNewURL(rawUrl);

      await test();
    }

    describe('External Redirects', function () {
      it('handles /buy route redirect', async function () {
        await withFixtures(
          await getConfig(this.test?.fullTitle()),
          async ({ driver }: { driver: Driver }) => {
            const rawUrl = `https://link.metamask.io/buy`;
            const test = () =>
              driver.waitForUrl({ url: `${BaseUrl.Portfolio}/buy` });
            await navigate(driver, rawUrl, test);
          },
        );
      });

      it('handles /perps route redirect', async function () {
        await withFixtures(
          await getConfig(this.test?.fullTitle()),
          async ({ driver }: { driver: Driver }) => {
            const rawUrl = `https://link.metamask.io/perps`;
            const test = () =>
              driver.waitForUrl({ url: `${BaseUrl.MetaMask}/perps` });
            await navigate(driver, rawUrl, test);
          },
        );
      });

      it('handles /predict route redirect', async function () {
        await withFixtures(
          await getConfig(this.test?.fullTitle()),
          async ({ driver }: { driver: Driver }) => {
            const rawUrl = `https://link.metamask.io/predict`;
            const test = () =>
              driver.waitForUrl({
                url: `${BaseUrl.MetaMask}/prediction-markets`,
              });

            await navigate(driver, rawUrl, test);
          },
        );
      });
    });

    describe('Internal Routing', () => {
      it('handles /rewards route', async function () {
        await withFixtures(
          await getConfig(this.test?.fullTitle()),
          async ({ driver }: { driver: Driver }) => {
            const rawUrl = `https://link.metamask.io/rewards`;
            const test = async () => {
              const page = new RewardsPage(driver);
              console.log('Checking if target page is loaded');
              await page.checkPageIsLoaded();
            };
            await navigate(driver, rawUrl, test);
          },
        );
      });
    });
  });
});
