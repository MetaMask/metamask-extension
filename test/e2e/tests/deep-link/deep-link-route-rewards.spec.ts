import assert from 'node:assert/strict';
import type { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import DeepLink from '../../page-objects/pages/deep-link-page';
import LoginPage from '../../page-objects/pages/login-page';
import HomePage from '../../page-objects/pages/home/homepage';
import RewardsPage from '../../page-objects/pages/rewards/rewards-page';
import { emptyHtmlPage } from '../../mock-e2e';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { REWARDS_ROUTE } from '../../../../ui/helpers/constants/routes';
import {
  bytesToB64,
  cartesianProduct,
  signDeepLink,
  generateECDSAKeyPair,
} from './helpers';

const TEST_PAGE = 'https://doesntexist.test/';

describe('Deep Link - Rewards Route', function () {
  /**
   * Generates the configuration for the test, including fixtures and
   * manifest flags.
   *
   * @param title - The title of the test, used for debugging and logging.
   * @param deepLinkPublicKey - The public key for deep link verification.
   */
  async function getConfig(title?: string, deepLinkPublicKey?: string) {
    return {
      fixtures: new FixtureBuilder().build(),
      title,
      manifestFlags: {
        testing: {
          deepLinkPublicKey,
        },
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

        // Rewards
        await server
          .forPost('https://rewards.uat-api.cx.metamask.io/public/rewards/ois')
          .thenJson(200, {
            ois: [true],
            sids: ['019b2245-9533-7739-a89c-b4c839a3d53a'],
          });

        await server
          .forPost('https://rewards.uat-api.cx.metamask.io/auth/mobile-login')
          .thenJson(200, {
            sessionId: 'yErC0OBAAh9BlS7frZYkjGz6RVyoo4p3R6nz3THmQlc=',
            accessToken: 'yErC0OBAAh9BlS7frZYkjGz6RVyoo4p3R6nz3THmQlc=',
            subscription: {
              id: '019b2245-9533-7739-a89c-b4c839a3d53a',
              createdAt: '2025-12-15T13:49:04.180Z',
              updatedAt: '2025-12-15T13:49:04.180Z',
              referralCode: '4DFZV9',
              accounts: [
                {
                  id: 4338,
                  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
                  blockchain: 1,
                  subscriptionId: '019b2245-9533-7739-a89c-b4c839a3d53a',
                  createdAt: '2025-12-15T13:49:04.180Z',
                  updatedAt: '2025-12-15T13:49:04.180Z',
                },
              ],
            },
          });
      },
    };
  }

  const scenarios = cartesianProduct(
    ['locked', 'unlocked'] as const,
    [
      'signed with sig_params',
      'signed without sig_params',
      'unsigned',
    ] as const,
    [REWARDS_ROUTE] as const,
    ['continue'] as const,
  ).map(([locked, signed, route, action]) => {
    return { locked, signed, route, action };
  });

  scenarios.forEach(({ locked, signed, route, action }) => {
    it(`handles ${locked} and ${signed} ${route} deep link with ${action} action`, async function () {
      const keyPair = await generateECDSAKeyPair();
      const deepLinkPublicKey = bytesToB64(
        await crypto.subtle.exportKey('raw', keyPair.publicKey),
      );

      await withFixtures(
        await getConfig(this.test?.fullTitle(), deepLinkPublicKey),
        async ({ driver }: { driver: Driver }) => {
          const isSigned =
            signed === 'signed with sig_params' ||
            signed === 'signed without sig_params';
          const withSigParams = signed === 'signed with sig_params';

          // ensure the background is ready to process deep links (by waiting
          // for the UI to load)
          console.log('Navigating to initial page');
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          console.log('Checking if login page is loaded');
          await loginPage.checkPageIsLoaded();

          // if `locked` is set to "unlocked", we need to log in _now_, so the
          // deep link's `continue` button is able to can skip the lock screen.
          if (locked === 'unlocked') {
            console.log('Logging in to homepage (unlocked scenario)');
            await loginPage.loginToHomepage();

            console.log('Checking if home page is loaded (unlocked scenario)');
            const homePage = new HomePage(driver);
            await homePage.checkPageIsLoaded();
          }

          // navigate to the route and make sure it
          // redirects to the deep link interstitial page
          const rawUrl = `https://link.metamask.io${route}`;
          const preparedUrl = isSigned
            ? await signDeepLink(keyPair.privateKey, rawUrl, withSigParams)
            : rawUrl;
          console.log('Opening deep link URL');
          await driver.openNewURL(preparedUrl);

          const deepLink = new DeepLink(driver);
          console.log('Checking if deep link page is loaded');
          await deepLink.checkPageIsLoaded();

          // we should render the checkbox when the link is "signed"
          const shouldRenderCheckbox = isSigned;
          console.log('Checking if deep link interstitial checkbox exists');
          const hasCheckbox =
            await deepLink.hasSkipDeepLinkInterstitialCheckBox();
          assert.equal(
            hasCheckbox,
            shouldRenderCheckbox,
            'Checkbox presence mismatch',
          );

          console.log('Clicking continue button');
          await deepLink.clickContinueButton();
          if (locked === 'locked') {
            console.log('Checking if login page is loaded (locked scenario)');
            await loginPage.checkPageIsLoaded();
            console.log('Logging in to homepage (locked scenario)');
            await loginPage.loginToHomepage();
          }

          // check that the rewards page has been loaded!
          const rewardsPage = new RewardsPage(driver);
          console.log('Checking if target page is loaded');
          await rewardsPage.checkPageIsLoaded();
        },
      );
    });
  });
});
