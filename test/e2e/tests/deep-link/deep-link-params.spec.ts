import assert from 'node:assert/strict';
import { Browser } from 'selenium-webdriver';
import { WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import DeepLink from '../../page-objects/pages/deep-link-page';
import LoginPage from '../../page-objects/pages/login-page';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import HomePage from '../../page-objects/pages/home/homepage';
import type { Anvil } from '../../seeder/anvil';
import type { Ganache } from '../../seeder/ganache';
import {
  bytesToB64,
  signDeepLink,
  generateECDSAKeyPair,
  getHashParams,
} from './helpers';
import { getConfig } from './helpers';

const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

type LocalNode = Ganache | Anvil;

const TEST_PAGE = 'https://doesntexist.test/';

describe('Deep Link - Parameter Handling & Security', function () {
  let keyPair: CryptoKeyPair;
  let deepLinkPublicKey: string;

  beforeEach(async function () {
    keyPair = await generateECDSAKeyPair();
    deepLinkPublicKey = bytesToB64(
      await crypto.subtle.exportKey('raw', keyPair.publicKey),
    );
  });

  // this test is skipped because the swap route does not work correctly in
  // the e2e environment. Once swaps/bridge flows are all fully migrated to the
  // route page this test can be re-enabled.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip("passes params to the deep link's component", async function () {
    await withFixtures(
      await getConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
      }),
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
      await getConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
      }),
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
      await getConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
      }),
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
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

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
        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('handles dapps that open MM via window.open', async function () {
    await withFixtures(
      await getConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
      }),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        // use our dummy page to drive the new window
        await driver.openNewURL(TEST_PAGE);

        const dappWindowHandle = await driver.driver.getWindowHandle();
        // simulate a dapp calling `window.open('https://link.metamask.io/home')`
        const windowOpened = await driver.executeScript(
          `
          globalThis.testWindow = window.open('https://link.metamask.io/home', '_blank');
          return globalThis.testWindow != null;
          `,
        );
        assert.strictEqual(windowOpened, true, 'window.open failed');

        await driver.delay(1000); // give the window a second to open

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const metamaskWindowHandle = await driver.driver.getWindowHandle();

        // wait for the homepage to load in this new window
        const deepLink = new DeepLink(driver);
        await deepLink.checkPageIsLoaded();
        const initialUrlStr = await driver.getCurrentUrl();
        const initialUrl = new URL(initialUrlStr);
        assert.equal(initialUrl.pathname, `/home.html`);
        assert.equal(initialUrl.hash, '#link?u=%2Fhome');
        assert.equal(initialUrl.search, '');

        await driver.switchToWindow(dappWindowHandle);

        const hackUrl = new URL(initialUrl);
        hackUrl.hash = '#notifications';
        // if we are testing Firefox, make sure `testWindow` is unset, FF
        // doesn't allow cross-origin access to the extension's window by
        // default
        if (isFirefox) {
          // globalThis.testWindow is unset in Firefox. Neat!
          await driver.executeScript(`return globalThis.testWindow == null;`);
        } else {
          // on chrome, the location change is ignored due to the
          // `cross_origin_opener_policy` set in the manifest.json
          await driver.executeScript(
            `globalThis.testWindow.location.href = ${JSON.stringify(hackUrl)};`,
          );
        }

        // go back to the Metamask window.
        await driver.switchToWindow(metamaskWindowHandle);

        const finalUrlStr = await driver.getCurrentUrl();
        assert.equal(finalUrlStr, initialUrlStr);
      },
    );
  });

  it('correctly exposes or filters params based on signing method', async function () {
    await withFixtures(
      await getConfig({
        title: this.test?.fullTitle(),
        deepLinkPublicKey,
      }),
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const deepLink = new DeepLink(driver);

        // 1. signed with sig_params only exposes foo (both) and bar, not baz
        console.log('Testing: signed with sig_params filters out unsigned params');
        const url1 = 'https://link.metamask.io/test?foo=0&foo=1&bar=2';
        const signedUrl1 = `${await signDeepLink(keyPair.privateKey, url1)}&baz=3`;
        await driver.openNewURL(signedUrl1);
        await deepLink.checkPageIsLoaded();
        await deepLink.clickContinueButton();
        const params1 = getHashParams(new URL(await driver.getCurrentUrl()));
        assert.deepStrictEqual(params1.getAll('foo'), ['0', '1']);
        assert.deepStrictEqual(params1.getAll('bar'), ['2']);
        assert.equal(params1.has('baz'), false);

        // 2. signed with empty sig_params + extra params appended: exposes nothing
        console.log('Testing: signed with empty sig_params does not expose extra params');
        const url2 = 'https://link.metamask.io/test';
        const signedUrl2 = `${await signDeepLink(keyPair.privateKey, url2)}&foo=0&foo=1&bar=2&baz=3`;
        await driver.openNewURL(signedUrl2);
        await deepLink.checkPageIsLoaded();
        await deepLink.clickContinueButton();
        const params2 = getHashParams(new URL(await driver.getCurrentUrl()));
        assert.deepStrictEqual(params2.size, 0);

        // 3. signed with sig_params, no extra params: exposes nothing (no params to forward)
        console.log('Testing: signed with sig_params and no params works');
        const url3 = 'https://link.metamask.io/test';
        const signedUrl3 = await signDeepLink(keyPair.privateKey, url3);
        await driver.openNewURL(signedUrl3);
        await deepLink.checkPageIsLoaded();
        await deepLink.clickContinueButton();
        const params3 = getHashParams(new URL(await driver.getCurrentUrl()));
        assert.deepStrictEqual(params3.size, 0);

        // 4. signed without sig_params exposes all params (foo, bar, baz)
        console.log('Testing: signed without sig_params exposes all params');
        const url4 = 'https://link.metamask.io/test?foo=1&bar=2&baz=3';
        const signedUrl4 = await signDeepLink(keyPair.privateKey, url4, false);
        await driver.openNewURL(signedUrl4);
        await deepLink.checkPageIsLoaded();
        await deepLink.clickContinueButton();
        const params4 = getHashParams(new URL(await driver.getCurrentUrl()));
        assert.deepStrictEqual(params4.getAll('foo'), ['1']);
        assert.deepStrictEqual(params4.getAll('bar'), ['2']);
        assert.deepStrictEqual(params4.getAll('baz'), ['3']);

        // 5. unsigned flow exposes all params including duplicate values
        console.log('Testing: unsigned flow exposes all params including duplicates');
        const url5 = 'https://link.metamask.io/test?foo=1&foo=2&bar=3';
        await driver.openNewURL(url5);
        await deepLink.checkPageIsLoaded();
        await deepLink.clickContinueButton();
        const params5 = getHashParams(new URL(await driver.getCurrentUrl()));
        assert.deepStrictEqual(params5.getAll('foo'), ['1', '2']);
        assert.deepStrictEqual(params5.getAll('bar'), ['3']);
      },
    );
  });
});
