import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import {
  bytesToB64,
  generateECDSAKeyPair,
  getConfig,
  prepareDeepLinkUrl,
  shouldRenderCheckbox,
} from './helpers';

describe('Deep Link - /perps/market Route', function () {
  // eslint-disable-next-line mocha/no-skipped-tests -- market detail checkPageIsLoaded requires WebSocket market data to render past the skeleton
  it.skip('navigates to market detail page for a crypto symbol', async function () {
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
          route: '/perps/market?symbol=BTC',
          signed: 'signed with sig_params',
          privateKey: keyPair.privateKey,
        });

        await navigateDeepLinkToDestination(
          driver,
          preparedUrl,
          'unlocked',
          shouldRenderCheckbox('signed with sig_params'),
          PerpsMarketDetailPage,
        );
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- market detail checkPageIsLoaded requires WebSocket market data to render past the skeleton
  it.skip('navigates to market detail page for a HIP-3 symbol', async function () {
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
            perpsHip3AllowlistMarkets: 'xyz:*',
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
          route: '/perps/market?symbol=xyz:TSLA',
          signed: 'signed with sig_params',
          privateKey: keyPair.privateKey,
        });

        await navigateDeepLinkToDestination(
          driver,
          preparedUrl,
          'unlocked',
          shouldRenderCheckbox('signed with sig_params'),
          PerpsMarketDetailPage,
        );
      },
    );
  });
});
