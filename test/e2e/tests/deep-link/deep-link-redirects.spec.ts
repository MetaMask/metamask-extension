import type { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { emptyHtmlPage } from '../../mock-e2e';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { BaseUrl } from '../../../../shared/constants/urls';
import { bytesToB64, signDeepLink, generateECDSAKeyPair } from './helpers';

const TEST_PAGE = 'https://doesntexist.test/';

describe('Deep Link - External Redirects', function () {
  let keyPair: CryptoKeyPair;
  let deepLinkPublicKey: string;

  beforeEach(async function () {
    keyPair = await generateECDSAKeyPair();
    deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );
  });

  /**
   * Generates the configuration for the test, including fixtures and
   * manifest flags.
   *
   * @param title - The title of the test, used for debugging and logging.
   */
  async function getConfig(title?: string) {
    return {
      fixtures: new FixtureBuilder().build(),
      title,
      manifestFlags: {
        testing: {
          deepLinkPublicKey,
        },
      },
      testSpecificMock: async (server: Mockttp) => {
        // Deep Links
        await server
          .forGet(/^https?:\/\/link\.metamask\.io\/.*$/u)
          .thenCallback(() => {
            return {
              statusCode: 200,
              body: emptyHtmlPage(),
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
              },
            };
          });
        await server.forGet(TEST_PAGE).thenCallback(() => {
          return {
            statusCode: 200,
            body: emptyHtmlPage(),
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
            },
          };
        });
      },
    };
  }

  it('handles /buy route redirect', async function () {
    await withFixtures(
      await getConfig(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const rawUrl = `https://link.metamask.io/buy`;
        const signedUrl = await signDeepLink(keyPair.privateKey, rawUrl);

        // test signed flow
        await driver.openNewURL(signedUrl);

        await driver.waitForUrl({ url: `${BaseUrl.Portfolio}/buy` });

        await driver.navigate();
        await homePage.checkPageIsLoaded();

        // test unsigned flow
        await driver.openNewURL(rawUrl);

        await driver.waitForUrl({ url: `${BaseUrl.Portfolio}/buy` });
      },
    );
  });

  it('handles /card-onboarding route redirect', async function () {
    await withFixtures(
      await getConfig(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const rawUrl = `https://link.metamask.io/card-onboarding`;
        const signedUrl = await signDeepLink(keyPair.privateKey, rawUrl);

        // test signed flow
        await driver.openNewURL(signedUrl);

        await driver.waitForUrl({
          url: `${BaseUrl.MetaMask}/card`,
        });

        await driver.navigate();
        await homePage.checkPageIsLoaded();

        // test unsigned flow
        await driver.openNewURL(rawUrl);

        await driver.waitForUrl({
          url: `${BaseUrl.MetaMask}/card`,
        });
      },
    );
  });

  it('handles /perps route redirect', async function () {
    await withFixtures(
      await getConfig(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const rawUrl = `https://link.metamask.io/perps`;
        const signedUrl = await signDeepLink(keyPair.privateKey, rawUrl);

        // test signed flow
        await driver.openNewURL(signedUrl);

        await driver.waitForUrl({ url: `${BaseUrl.MetaMask}/perps` });

        await driver.navigate();
        await homePage.checkPageIsLoaded();

        // test unsigned flow
        await driver.openNewURL(rawUrl);

        await driver.waitForUrl({ url: `${BaseUrl.MetaMask}/perps` });
      },
    );
  });

  it('handles /predict route redirect', async function () {
    await withFixtures(
      await getConfig(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const rawUrl = `https://link.metamask.io/predict`;
        const signedUrl = await signDeepLink(keyPair.privateKey, rawUrl);

        // test signed flow
        await driver.openNewURL(signedUrl);

        await driver.waitForUrl({
          url: `${BaseUrl.MetaMask}/prediction-markets`,
        });

        await driver.navigate();
        await homePage.checkPageIsLoaded();

        // test unsigned flow
        await driver.openNewURL(rawUrl);

        await driver.waitForUrl({
          url: `${BaseUrl.MetaMask}/prediction-markets`,
        });
      },
    );
  });
});
