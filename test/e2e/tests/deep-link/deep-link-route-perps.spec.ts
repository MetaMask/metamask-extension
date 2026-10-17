import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import { BOTTOM_NAV_AB_TEST_KEY } from '../../../../shared/lib/ab-testing/configs/bottom-nav-bar';
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

const CONTROL_PERPS_FEATURE_FLAGS = {
  remoteFeatureFlags: {
    ...PERPS_FEATURE_FLAGS.remoteFeatureFlags,
    [BOTTOM_NAV_AB_TEST_KEY]: 'control',
  },
};

const TREATMENT_PERPS_FEATURE_FLAGS = {
  remoteFeatureFlags: {
    ...PERPS_FEATURE_FLAGS.remoteFeatureFlags,
    [BOTTOM_NAV_AB_TEST_KEY]: 'treatment',
  },
};

async function getPerpsHomeConfig({
  title,
  deepLinkPublicKey,
  variant,
}: {
  title?: string;
  deepLinkPublicKey: string;
  variant: 'control' | 'treatment';
}) {
  const manifestFlags =
    variant === 'treatment'
      ? TREATMENT_PERPS_FEATURE_FLAGS
      : CONTROL_PERPS_FEATURE_FLAGS;
  const config = await getConfig({
    title,
    deepLinkPublicKey,
    manifestFlags,
  });

  return {
    ...config,
    fixtures: {
      ...config.fixtures,
      data: {
        ...config.fixtures.data,
        RemoteFeatureFlagController: {
          ...config.fixtures.data.RemoteFeatureFlagController,
          remoteFeatureFlags: {
            ...(config.fixtures.data.RemoteFeatureFlagController
              ?.remoteFeatureFlags ?? {}),
            [BOTTOM_NAV_AB_TEST_KEY]: variant,
          },
        },
      },
    },
  };
}

/**
 * Creates a lightweight page class that asserts the extension's hash URL has
 * the expected destination after navigation. Used instead of waiting for
 * specific DOM elements that require full feature setup (e.g. perps streams).
 *
 * @param expectedPath - The exact path expected in the URL hash.
 * @param expectedSearch - The exact query string expected in the URL hash.
 */
function urlMatchesDestination(expectedPath: string, expectedSearch = '') {
  return class {
    private readonly driver: Driver;

    constructor(driver: Driver) {
      this.driver = driver;
    }

    async checkPageIsLoaded(): Promise<void> {
      await this.driver.waitUntil(
        async () => {
          const url = await this.driver.getCurrentUrl();
          const destination = new URL(
            new URL(url).hash.slice(1),
            'https://extension.invalid',
          );
          return (
            destination.pathname === expectedPath &&
            destination.search === expectedSearch
          );
        },
        { timeout: 10000, interval: 500 },
      );
    }
  };
}

describe('Deep Link - /perps Route', function () {
  /**
   * In the control bucket, home-navigation routes resolve to the wallet home
   * page with the Perps tab selected.
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
          await getPerpsHomeConfig({
            title: this.test?.fullTitle(),
            deepLinkPublicKey,
            variant: 'control',
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
              urlMatchesDestination('/', '?tab=perps'),
            );
          },
        );
      });
    },
  );

  homeRoutes.forEach((route) => {
    it(`navigates ${route} to the canonical route in the bottom-nav treatment`, async function () {
      const keyPair = await generateECDSAKeyPair();
      const deepLinkPublicKey = bytesToB64(
        await crypto.subtle.exportKey('raw', keyPair.publicKey),
      );

      await withFixtures(
        await getPerpsHomeConfig({
          title: this.test?.fullTitle(),
          deepLinkPublicKey,
          variant: 'treatment',
        }),
        async ({ driver }: { driver: Driver }) => {
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          await loginPage.checkPageIsLoaded();
          await loginPage.loginToHomepage();
          await new HomePage(driver).checkPageIsLoaded();

          const preparedUrl = await prepareDeepLinkUrl({
            route,
            signed: 'signed with sig_params',
            privateKey: keyPair.privateKey,
          });

          await navigateDeepLinkToDestination(
            driver,
            preparedUrl,
            'unlocked',
            shouldRenderCheckbox('signed with sig_params'),
            urlMatchesDestination('/perps'),
          );
        },
      );
    });
  });

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
              urlMatchesDestination('/perps/market/BTC'),
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
              urlMatchesDestination(
                '/perps/market-list',
                route.includes('tab=crypto') ? '?filter=crypto' : '',
              ),
            );
          },
        );
      });
    },
  );
});
