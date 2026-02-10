import type { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import RewardsPage from '../../page-objects/pages/rewards/rewards-page';
import { REWARDS_ROUTE } from '../../../../ui/helpers/constants/routes';
import { navigateDeepLinkToDestination } from '../../page-objects/flows/deep-link.flow';
import { bytesToB64, generateECDSAKeyPair } from './helpers';
import {
  getConfig,
  prepareDeepLinkUrl,
  shouldRenderCheckbox,
  mockRewardsApi,
} from './deep-link-helpers';

describe('Deep Link - Rewards Route', function () {
  it('handles rewards deep link route', async function () {
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
            rewardsEnabled: {
              enabled: true,
              minimumVersion: '0.0.0',
            },
            rewardsOnboardingEnabled: {
              enabled: true,
              minimumVersion: '0.0.0',
            },
            rewardsBitcoinEnabledExtension: true,
            rewardsTronEnabledExtension: true,
          },
        },
        additionalMocks: async (server: Mockttp) => {
          await mockRewardsApi(server);
        },
      }),
      async ({ driver }: { driver: Driver }) => {
        // ensure the background is ready to process deep links (by waiting
        // for the UI to load)
        console.log('Navigating to initial page');
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        console.log('Checking if login page is loaded');
        await loginPage.checkPageIsLoaded();

        // log in so the deep link's `continue` button can skip the lock screen
        console.log('Logging in to homepage');
        await loginPage.loginToHomepage();

        console.log('Checking if home page is loaded');
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // navigate to the route and make sure it
        // redirects to the deep link interstitial page
        const preparedUrl = await prepareDeepLinkUrl({
          route: REWARDS_ROUTE,
          signed: 'signed with sig_params',
          privateKey: keyPair.privateKey,
        });

        // Navigate through deep link interstitial and verify the rewards page has been loaded!
        await navigateDeepLinkToDestination(
          driver,
          preparedUrl,
          'unlocked',
          shouldRenderCheckbox('signed with sig_params'),
          RewardsPage,
        );
      },
    );
  });
});
