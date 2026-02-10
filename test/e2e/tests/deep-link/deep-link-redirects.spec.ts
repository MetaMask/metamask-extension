import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { BaseUrl } from '../../../../shared/constants/urls';
import { bytesToB64, generateECDSAKeyPair } from './helpers';
import { getConfig, prepareDeepLinkUrl } from './deep-link-helpers';

describe('Deep Link - External Redirects', function () {
  it('handles /buy route redirect', async function () {
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

        // Test signed flow
        const signedUrl = await prepareDeepLinkUrl({
          route: '/buy',
          signed: 'signed with sig_params',
          privateKey: keyPair.privateKey,
        });
        await driver.openNewURL(signedUrl);
        await driver.waitForUrl({ url: `${BaseUrl.Portfolio}/buy` });

        await driver.navigate();
        await homePage.checkPageIsLoaded();

        // test unsigned flow
        const unsignedUrl = await prepareDeepLinkUrl({
          route: '/buy',
          signed: 'unsigned',
        });
        await driver.openNewURL(unsignedUrl);
        await driver.waitForUrl({ url: `${BaseUrl.Portfolio}/buy` });
      },
    );
  });

  it('handles /card-onboarding route redirect', async function () {
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

        // test signed flow
        const signedUrl = await prepareDeepLinkUrl({
          route: '/card-onboarding',
          signed: 'signed with sig_params',
          privateKey: keyPair.privateKey,
        });
        await driver.openNewURL(signedUrl);
        await driver.waitForUrl({
          url: `${BaseUrl.MetaMask}/card`,
        });

        await driver.navigate();
        await homePage.checkPageIsLoaded();

        // test unsigned flow
        const unsignedUrl = await prepareDeepLinkUrl({
          route: '/card-onboarding',
          signed: 'unsigned',
        });
        await driver.openNewURL(unsignedUrl);
        await driver.waitForUrl({
          url: `${BaseUrl.MetaMask}/card`,
        });
      },
    );
  });

  it('handles /perps route redirect', async function () {
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

        // test signed flow
        const signedUrl = await prepareDeepLinkUrl({
          route: '/perps',
          signed: 'signed with sig_params',
          privateKey: keyPair.privateKey,
        });
        await driver.openNewURL(signedUrl);
        await driver.waitForUrl({ url: `${BaseUrl.MetaMask}/perps` });

        await driver.navigate();
        await homePage.checkPageIsLoaded();

        // test unsigned flow
        const unsignedUrl = await prepareDeepLinkUrl({
          route: '/perps',
          signed: 'unsigned',
        });
        await driver.openNewURL(unsignedUrl);
        await driver.waitForUrl({ url: `${BaseUrl.MetaMask}/perps` });
      },
    );
  });

  it('handles /predict route redirect', async function () {
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

        // test signed flow
        const signedUrl = await prepareDeepLinkUrl({
          route: '/predict',
          signed: 'signed with sig_params',
          privateKey: keyPair.privateKey,
        });
        await driver.openNewURL(signedUrl);
        await driver.waitForUrl({
          url: `${BaseUrl.MetaMask}/prediction-markets`,
        });

        await driver.navigate();
        await homePage.checkPageIsLoaded();

        // test unsigned flow
        const unsignedUrl = await prepareDeepLinkUrl({
          route: '/predict',
          signed: 'unsigned',
        });
        await driver.openNewURL(unsignedUrl);
        await driver.waitForUrl({
          url: `${BaseUrl.MetaMask}/prediction-markets`,
        });
      },
    );
  });
});
