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
import { BaseUrl } from '../../../../shared/constants/urls';
import type { Anvil } from '../../seeder/anvil';
import type { Ganache } from '../../seeder/ganache';
import {
  bytesToB64,
  cartesianProduct,
  signDeepLink,
  generateECDSAKeyPair,
} from './helpers';

type LocalNode = Ganache | Anvil;

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
    ['continue'] as const,
  ).map(([locked, signed, route, action]) => {
    return { locked, signed, route, action };
  });

  scenarios.forEach(({ locked, signed, route, action }) => {
    it(`handles ${locked} and ${signed} ${route} deep link with ${action} action`, async function () {
      await withFixtures(
        await getConfig(this.test?.fullTitle()),
        async ({ driver }: { driver: Driver }) => {
          const isSigned = signed === 'signed';
          const isInvalidRoute = route === '/INVALID';

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

          // navigate to https://link.metamask.io/home and make sure it
          // redirects to the deep link interstitial page
          const rawUrl = `https://link.metamask.io${route}`;
          // note: we sign the "/INVALID" link as well, as signed links that no
          // longer exist/match should be treated handled the same way as
          // unsigned links. We test for this below.
          const preparedUrl = isSigned
            ? await signDeepLink(keyPair.privateKey, rawUrl)
            : rawUrl;
          console.log('Opening deep link URL');
          await driver.openNewURL(preparedUrl);

          const deepLink = new DeepLink(driver);
          console.log('Checking if deep link page is loaded');
          await deepLink.checkPageIsLoaded();

          // we should render the checkbox when the link is "signed", unless
          // it's an "INVALID" route
          const shouldRenderCheckbox = isSigned && !isInvalidRoute;
          console.log('Checking if deep link interstitial checkbox exists');
          const hasCheckbox =
            await deepLink.hasSkipDeepLinkInterstitialCheckBox();
          assert.equal(
            hasCheckbox,
            shouldRenderCheckbox,
            'Checkbox presence mismatch',
          );

          if (isInvalidRoute) {
            console.log('Getting error text for invalid route');
            const text = await deepLink.getDescriptionText();
            assert.equal(
              text,
              `We can't find the page you are looking for.${
                isSigned
                  ? `
Update to the latest version of MetaMask
and we'll take you to the right place.`
                  : ''
              }`,
            );
          }

          console.log('Clicking continue button');
          await deepLink.clickContinueButton();
          if (locked === 'locked') {
            console.log('Checking if login page is loaded (locked scenario)');
            await loginPage.checkPageIsLoaded();
            console.log('Logging in to homepage (locked scenario)');
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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              throw new Error(`Unknown route: ${route}`);
            }
          }
          // check that the page we want has been loaded!
          const page = new Page(driver);
          console.log('Checking if target page is loaded');
          page.checkPageIsLoaded();
        },
      );
    });
  });

  it('handles /buy route redirect', async function () {
    await withFixtures(
      await getConfig(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const rawUrl = `https://link.metamask.io/buy`;
        const signedUrl = await signDeepLink(keyPair.privateKey, rawUrl);

        // test signed flow
        await driver.openNewURL(signedUrl);

        const url = new URL(signedUrl);
        await driver.waitForUrl({
          url: `${BaseUrl.Portfolio}/buy${url.search}`,
        });

        await driver.navigate();
        homePage.checkPageIsLoaded();

        // test unsigned flow
        await driver.openNewURL(rawUrl);

        await driver.waitForUrl({
          url: `${BaseUrl.Portfolio}/buy`,
        });
      },
    );
  });

  // this test is skipped because the swap route does not work correctly in
  // the e2e environment. Once swaps/bridge flows are all fully migrated to the
  // route page this test can be re-enabled.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip("passes params to the deep link's component", async function () {
    await withFixtures(
      await getConfig(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // params that are not related to the swap, and get filtered out
        // (may or not be processed by the deep link router, but we aren't
        // concerned with that in this test)
        const extraParams = {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          utm_medium: '123',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          attribution_id: '456',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          random_param: '789',
        };
        // these should all be forwarded to the swap page
        const swapsParams = {
          from: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          to: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          value: '0x38d7ea4c68000',
        };
        const params = new URLSearchParams({ ...extraParams, ...swapsParams });
        const rawUrl = `https://link.metamask.io/swap?${params.toString()}`;

        // test signed flow
        await driver.openNewURL(rawUrl);

        const deepLink = new DeepLink(driver);
        await deepLink.checkPageIsLoaded();

        await deepLink.clickContinueButton();
        await new SwapPage(driver).checkPageIsLoaded();

        const currentUrl = await driver.getCurrentUrl();

        // the URL params is actually in the `hash`, e.g. #some/path?query=param
        const hash = new URL(currentUrl).hash.slice(1);
        const urlParams = new URLSearchParams(hash.split('?')[1]);

        // ensure all of the params are all present in the URL
        assert.deepStrictEqual(
          Object.fromEntries(urlParams.entries()),
          swapsParams,
        );
      },
    );
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
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const rawUrl = `https://link.metamask.io/home`;
        const signedUrl = await signDeepLink(keyPair.privateKey, rawUrl);
        await driver.openNewURL(signedUrl);
        const internalDeepLinkUrl = await driver.getCurrentUrl();
        const deepLink = new DeepLink(driver);
        await deepLink.checkPageIsLoaded();
        const isChecked =
          await deepLink.getSkipDeepLinkInterstitialCheckBoxState();
        assert.equal(isChecked, false, 'checkbox should not be checked');

        // check the checkbox
        await deepLink.setSkipDeepLinkInterstitialCheckBox(true);

        // click continue
        await deepLink.clickContinueButton();

        // make sure we're on the home page
        await homePage.checkPageIsLoaded();

        // a nice in-between page to make testing more obvious
        await driver.openNewURL(TEST_PAGE);

        // open the deep link again, it should go straight to the home page
        await driver.openNewURL(signedUrl);
        await homePage.checkPageIsLoaded();

        // navigating to an unsigned page should NOT skip the interstitial
        await driver.openNewURL(rawUrl);
        await deepLink.checkPageIsLoaded();

        // navigating to the internalDeepLinkUrl should display the interstitial
        // with the checkbox *already checked*
        await driver.openNewURL(internalDeepLinkUrl);
        await deepLink.checkPageIsLoaded();
        const isChecked2 =
          await deepLink.getSkipDeepLinkInterstitialCheckBoxState();
        assert.equal(isChecked2, true, 'checkbox should be checked');

        // unchecking the checkbox should cause the interstitial to be shown
        // for signed links again
        await deepLink.setSkipDeepLinkInterstitialCheckBox(false);
        await deepLink.clickContinueButton();

        // open the signed link again, it should show the interstitial
        await driver.openNewURL(signedUrl);
        await deepLink.checkPageIsLoaded();
      },
    );
  });

  it("does not allow the loading screen over the deep link's component", async function () {
    await withFixtures(
      await getConfig(this.test?.fullTitle()),
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: LocalNode[];
      }) => {
        await driver.navigate();
        // shut down all local nodes to ensure the network loading screen is needed
        await Promise.all(localNodes.map((node) => node.quit()));

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();

        const rawUrl = `https://link.metamask.io/home`;
        const signedUrl = await signDeepLink(keyPair.privateKey, rawUrl);

        // test signed flow
        await driver.openNewURL(signedUrl);
        const deepLink = new DeepLink(driver);
        await deepLink.checkPageIsLoaded();

        // make sure the loading overlays is not present
        await driver.assertElementNotPresent('.loading-overlay');

        // make sure we can click the continue button
        await deepLink.clickContinueButton();

        // make sure the home page has loaded!
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
      },
    );
  });
});
