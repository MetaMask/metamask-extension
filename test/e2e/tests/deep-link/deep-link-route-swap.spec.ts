import assert from 'node:assert/strict';
import type { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import DeepLink from '../../page-objects/pages/deep-link-page';
import LoginPage from '../../page-objects/pages/login-page';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { emptyHtmlPage } from '../../mock-e2e';
import FixtureBuilder from '../../fixtures/fixture-builder';
import {
  bytesToB64,
  cartesianProduct,
  signDeepLink,
  generateECDSAKeyPair,
} from './helpers';

const TEST_PAGE = 'https://doesntexist.test/';

describe('Deep Link - /swap Route', function () {
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

  const scenarios = cartesianProduct(
    ['locked', 'unlocked'] as const,
    [
      'signed with sig_params',
      'signed without sig_params',
      'unsigned',
    ] as const,
    ['/swap'] as const,
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

          // check that the swap page has been loaded!
          const swapPage = new SwapPage(driver);
          console.log('Checking if target page is loaded');
          await swapPage.checkPageIsLoaded();
        },
      );
    });
  });
});
