import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import {
  bytesToB64,
  generateECDSAKeyPair,
  getConfig,
  prepareDeepLinkUrl,
  shouldRenderCheckbox,
} from './helpers';

describe('Deep Link - /perps/market-list Route', function () {
  it('navigates to market list page without a filter', async function () {
    const keyPair = await generateECDSAKeyPair();
    const deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );

    await withFixtures(
      await getConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
        manifestFlags: {
          remoteFeatureFlags: {
            perpsEnabledVersion: {
              enabled: true,
              minimumVersion: '0.0.0',
            },
          },
        },
      }),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const preparedUrl = await prepareDeepLinkUrl({
          route: '/perps/market-list',
          signed: 'signed with sig_params',
          privateKey: keyPair.privateKey,
        });

        await navigateDeepLinkToDestination(
          driver,
          preparedUrl,
          'unlocked',
          shouldRenderCheckbox('signed with sig_params'),
          PerpsMarketListPage,
        );
      },
    );
  });

  it('navigates to market list page with a filter pre-selected', async function () {
    const keyPair = await generateECDSAKeyPair();
    const deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );

    await withFixtures(
      await getConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
        manifestFlags: {
          remoteFeatureFlags: {
            perpsEnabledVersion: {
              enabled: true,
              minimumVersion: '0.0.0',
            },
          },
        },
      }),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const preparedUrl = await prepareDeepLinkUrl({
          route: '/perps/market-list?filter=crypto',
          signed: 'signed with sig_params',
          privateKey: keyPair.privateKey,
        });

        await navigateDeepLinkToDestination(
          driver,
          preparedUrl,
          'unlocked',
          shouldRenderCheckbox('signed with sig_params'),
          PerpsMarketListPage,
        );
      },
    );
  });
});
