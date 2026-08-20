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

const PERPS_FEATURE_FLAGS = {
  remoteFeatureFlags: {
    perpsEnabledVersion: {
      enabled: true,
      minimumVersion: '0.0.0',
    },
  },
};

/**
 * Creates a lightweight page class that asserts the extension's hash URL
 * contains the expected path after navigation. Used instead of waiting for
 * specific DOM elements that require full feature setup (e.g. perps streams).
 *
 * @param expectedPath - The path segment that must appear in the URL hash,
 * e.g. '/perps/market/' or '/perps/market-list'.
 */
function urlContainsPath(expectedPath: string) {
  return class {
    private readonly driver: Driver;

    constructor(driver: Driver) {
      this.driver = driver;
    }

    async checkPageIsLoaded(): Promise<void> {
      await this.driver.waitUntil(
        async () => {
          const url = await this.driver.getCurrentUrl();
          return new URL(url).hash.includes(expectedPath);
        },
        { timeout: 10000, interval: 500 },
      );
    }
  };
}

describe('Deep Link - /perps Route', function () {
  /**
   * Home-navigation routes: all resolve to the wallet home page with the Perps
   * tab selected — no feature flag required.
   */
  const homeRoutes = ['/perps', '/perps-markets'];

  generateScenariosForRoutes(homeRoutes).forEach(
    ({ locked, signed, route, action }) => {
      it(`handles ${locked} and ${signed} ${route} deep link with ${action} action`, async function () {
        const keyPair = await generateECDSAKeyPair();
        const deepLinkPublicKey = bytesToB64(
          await crypto.subtle.exportKey('raw', keyPair.publicKey),
        );

        await withFixtures(
          await getConfig({ title: this.test?.fullTitle(), deepLinkPublicKey }),
          async ({ driver }: { driver: Driver }) => {
            await driver.navigate();
            const loginPage = new LoginPage(driver);
            await loginPage.checkPageIsLoaded();

            if (locked === 'unlocked') {
              await loginPage.loginToHomepage();
              await new HomePage(driver).checkPageIsLoaded();
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
    },
  );

  /**
   * Market detail routes: /perps?screen=asset and /perps-asset.
   * Verified by checking the URL hash contains the expected path.
   */
  const assetRoutes = [
    '/perps?screen=asset&symbol=BTC',
    '/perps-asset?symbol=BTC',
  ];

  generateScenariosForRoutes(assetRoutes).forEach(
    ({ locked, signed, route, action }) => {
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
              await new HomePage(driver).checkPageIsLoaded();
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
              urlContainsPath('/perps/market/BTC'),
            );
          },
        );
      });
    },
  );

  /**
   * Market list routes: /perps?screen=market-list with and without filter.
   * Verified by checking the URL hash contains the expected path.
   */
  const marketListRoutes = [
    '/perps?screen=market-list',
    '/perps?screen=market-list&tab=crypto',
  ];

  generateScenariosForRoutes(marketListRoutes).forEach(
    ({ locked, signed, route, action }) => {
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
              await new HomePage(driver).checkPageIsLoaded();
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
              urlContainsPath('/perps/market-list'),
            );
          },
        );
      });
    },
  );
});
