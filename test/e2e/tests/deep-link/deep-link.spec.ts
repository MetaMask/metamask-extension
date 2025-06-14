import assert from 'node:assert/strict';
import type { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import DeepLink from '../../page-objects/pages/deep-link-page';
import LoginPage from '../../page-objects/pages/login-page';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { emptyHtmlPage } from '../../mock-e2e';
import FixtureBuilder from '../../fixture-builder';
import {
  bytesToB64,
  cartesianProduct,
  signDeepLink,
  generateECDSAKeyPair,
} from './helpers';

const TEST_PAGE = 'https://doesntexist.test/';

describe('Deep Link', function () {
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

  const scenarios = cartesianProduct(
    ['locked', 'unlocked'] as const,
    ['signed', 'unsigned'] as const,
    ['/home', '/swap', '/INVALID'] as const,
    ['continue', 'cancel'] as const,
  ).map(([locked, signed, route, action]) => {
    return { locked, signed, route, action };
  });

  scenarios.forEach(({ locked, signed, route, action }) => {
    it(`handles ${locked} and ${signed} ${route} deeplink with ${action} action`, async function () {
      await withFixtures(
        await getConfig(this.test?.fullTitle()),
        async ({ driver }: { driver: Driver }) => {
          const isSigned = signed === 'signed';
          const isInvalidRoute = route === '/INVALID';

          // ensure the background is ready to process deep links (by waiting
          // for the UI to load)
          await driver.navigate();
          const loginPage = new LoginPage(driver);
          await loginPage.check_pageIsLoaded();

          // if `locked` is set to "unlocked", we need to log in _now_, so the
          // deep link's `continue` button is able to can skip the lock screen.
          if (locked === 'unlocked') {
            await loginPage.loginToHomepage();
          }

          // if we'll later need to test the "cancel" action we need to first
          // navigate to our TEST_PAGE to ensure the deep link interstitial page
          // cancel button goes back as expected.
          if (action === 'cancel') {
            await driver.openNewURL(TEST_PAGE);
            await driver.waitForSelector('[data-testid="empty-page-body"]');
          }

          // navigate to https://link.metamask.io/home and make sure it
          // redirects to the deep link interstitial page
          const rawUrl = `https://link.metamask.io${route}`;
          // note: we sign the "/INVALID" link as well, as signed links that no
          // longer exist/match should be treated handled the same way as
          // unsigned links. We test for this below.
          const preparedUrl = isSigned
            ? await signDeepLink(keyPair.privateKey, rawUrl)
            : rawUrl;
          await driver.openNewURL(preparedUrl);
          const deepLink = new DeepLink(driver);
          await deepLink.check_pageIsLoaded();

          // we should render the checkbox when the link is "signed", unless
          // it's an "INVALID" route
          const shouldRenderCheckbox = isSigned && !isInvalidRoute;
          const hasCheckbox =
            await deepLink.hasSkipDeepLinkInterstitialCheckBox();
          assert.equal(
            hasCheckbox,
            shouldRenderCheckbox,
            'Checkbox presence mismatch',
          );

          if (isInvalidRoute) {
            const text = await deepLink.getErrorText();
            assert.equal(text, 'The requested page was not found.');
          }

          if (action === 'cancel') {
            // if the action is "cancel", we should not proceed to the next page
            // and instead click the Cancel button, which should take us back to
            // our TEST_PAGE
            await deepLink.clickCancelButton();
            await driver.waitForSelector('[data-testid="empty-page-body"]');
          } else {
            await deepLink.clickContinueButton();
            if (locked === 'locked') {
              await loginPage.check_pageIsLoaded();
              await loginPage.loginToHomepage();
            }

            let Page;
            switch (route) {
              case '/home':
              case '/INVALID':
                Page = HomePage;
                break;
              case '/swap':
                Page = SwapPage;
                break;
              default: {
                throw new Error(`Unknown route: ${route}`);
              }
            }
            // check that the page we want has been loaded!
            const page = new Page(driver);
            page.check_pageIsLoaded();
          }
        },
      );
    });
  });

  it('handles the skipDeepLinkInterstitial flag correctly', async function () {
    await withFixtures(
      await getConfig(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        // This `skipDeepLinkInterstitial` test:
        // 1. checks the the option only applies for signed and verified links,
        // 2. the checkbox state is preserved,
        // 3. works as expected,
        // 4. and that it does not apply to unsigned links.

        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginPage.loginToHomepage();

        const rawUrl = `https://link.metamask.io/home`;
        const signedUrl = await signDeepLink(keyPair.privateKey, rawUrl);
        await driver.openNewURL(signedUrl);
        const internalDeepLinkUrl = await driver.getCurrentUrl();
        const deepLink = new DeepLink(driver);
        await deepLink.check_pageIsLoaded();
        const isChecked =
          await deepLink.getSkipDeepLinkInterstitialCheckBoxState();
        assert.equal(isChecked, false, 'checkbox should not be checked');

        // check the checkbox
        await deepLink.setSkipDeepLinkInterstitialCheckBox(true);

        // click continue
        await deepLink.clickContinueButton();

        // make sure we're on the home page
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        // a nice inbetween page to make testing more obvious
        await driver.openNewURL(TEST_PAGE);

        // open the deep link again, it should go straight to the home page
        await driver.openNewURL(signedUrl);
        await homePage.check_pageIsLoaded();

        // navigating to an unsigned page should NOT skip the interstitial
        await driver.openNewURL(rawUrl);
        await deepLink.check_pageIsLoaded();

        // navigating to the internalDeepLinkUrl should display the interstitial
        // with the checkbox *already checked*
        await driver.openNewURL(internalDeepLinkUrl);
        await deepLink.check_pageIsLoaded();
        const isChecked2 =
          await deepLink.getSkipDeepLinkInterstitialCheckBoxState();
        assert.equal(isChecked2, true, 'checkbox should be checked');

        // unchecking the checkbox should cause the interstitial to be shown
        // for signed links again
        await deepLink.setSkipDeepLinkInterstitialCheckBox(false);
        await deepLink.clickContinueButton();

        // open the signed link again, it should show the interstitial
        await driver.openNewURL(signedUrl);
        await deepLink.check_pageIsLoaded();
      },
    );
  });
});
