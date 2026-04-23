import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import {
  bytesToB64,
  generateECDSAKeyPair,
  generateScenariosForRoutes,
  getConfig,
  prepareDeepLinkUrl,
  shouldRenderCheckbox,
} from './helpers';

const PERPS_FEATURE_FLAGS = {
  remoteFeatureFlags: {
    perpsEnabledVersion: {
      enabled: true,
      minimumVersion: '0.0.0',
    },
  },
};

describe('Deep Link - /perps Route', function () {
  /**
   * Home-navigation routes: /perps (no params), /perps-markets, and screen values
   * that all resolve to the home page with the Perps tab selected.
   */
  const homeRoutes = [
    '/perps',
    '/perps-markets',
    '/perps?screen=tabs',
    '/perps?screen=home',
    '/perps?screen=markets',
  ];

  const homeScenarios = generateScenariosForRoutes(homeRoutes);

  homeScenarios.forEach(({ locked, signed, route, action }) => {
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
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          await loginPage.checkPageIsLoaded();

          if (locked === 'unlocked') {
            await loginPage.loginToHomepage();
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

  /**
   * Market detail routes: /perps?screen=asset&symbol=BTC and /perps-asset?symbol=BTC
   * Both resolve to the Perps Market Detail page.
   */
  const assetRoutes = [
    '/perps?screen=asset&symbol=BTC',
    '/perps-asset?symbol=BTC',
  ];

  const assetScenarios = generateScenariosForRoutes(assetRoutes);

  assetScenarios.forEach(({ locked, signed, route, action }) => {
    it(`handles ${locked} and ${signed} ${route} deep link with ${action} action`, async function () {
      const keyPair = await generateECDSAKeyPair();
      const deepLinkPublicKey = bytesToB64(
        await crypto.subtle.exportKey('raw', keyPair.publicKey),
      );

      await withFixtures(
        await getConfig({
          title: this.test?.fullTitle(),
          deepLinkPublicKey,
          manifestFlags: PERPS_FEATURE_FLAGS,
        }),
        async ({ driver }: { driver: Driver }) => {
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          await loginPage.checkPageIsLoaded();

          if (locked === 'unlocked') {
            await loginPage.loginToHomepage();
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
            PerpsMarketDetailPage,
          );
        },
      );
    });
  });

  /**
   * Market list routes: /perps?screen=market-list (with and without filter tab).
   * Resolves to the Perps Market List page.
   */
  const marketListRoutes = [
    '/perps?screen=market-list',
    '/perps?screen=market-list&tab=crypto',
  ];

  const marketListScenarios = generateScenariosForRoutes(marketListRoutes);

  marketListScenarios.forEach(({ locked, signed, route, action }) => {
    it(`handles ${locked} and ${signed} ${route} deep link with ${action} action`, async function () {
      const keyPair = await generateECDSAKeyPair();
      const deepLinkPublicKey = bytesToB64(
        await crypto.subtle.exportKey('raw', keyPair.publicKey),
      );

      await withFixtures(
        await getConfig({
          title: this.test?.fullTitle(),
          deepLinkPublicKey,
          manifestFlags: PERPS_FEATURE_FLAGS,
        }),
        async ({ driver }: { driver: Driver }) => {
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          await loginPage.checkPageIsLoaded();

          if (locked === 'unlocked') {
            await loginPage.loginToHomepage();
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
            PerpsMarketListPage,
          );
        },
      );
    });
  });
});
