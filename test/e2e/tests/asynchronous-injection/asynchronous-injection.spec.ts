import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Browser } from 'selenium-webdriver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import { Driver } from '../../webdriver/driver';

const CUSTOM_DAPP_PATH = './tests/asynchronous-injection/';

// `script-src-elem 'self' blob:` blocks the synchronous inline `<script>`
// the inpage wrapper appends to `documentElement` (no `'unsafe-inline'`)
const FALLBACK_FORCING_CSP = "script-src-elem 'self'";

const PROVIDER_INJECTION_TIMEOUT_MS = 5_000;

/**
 * Returns whether the MetaMask inpage provider has been exposed on the page's
 * `window`. Selenium's `executeScript` runs in the page's main world, so this
 * sees the same `window.ethereum` a dapp would see (not the content script's
 * isolated-world view, where `window.ethereum` is never set).
 *
 * @param driver - Selenium driver wrapper
 * @returns true if `window.ethereum.isMetaMask` is truthy
 */
async function isMetaMaskProviderInjected(driver: Driver): Promise<boolean> {
  return await driver.executeScript(
    'return Boolean(window.ethereum && window.ethereum.isMetaMask);',
  );
}

/**
 * Polls until the MetaMask inpage provider is exposed on the page or the
 * timeout elapses. The fallback path is asynchronous (it loads the inpage
 * source via a `blob:` URL), so a single snapshot check is not sufficient.
 *
 * @param driver - Selenium driver wrapper
 */
async function waitForProviderInjection(driver: Driver): Promise<void> {
  await driver.wait(
    async () => isMetaMaskProviderInjected(driver),
    PROVIDER_INJECTION_TIMEOUT_MS,
  );
}

/**
 * Reads the `ethereumAvailableDuringPageLoad` property the mock page sets
 * during initial parsing. It is `true` when the page's inline capture script
 * ran (i.e. CSP did not block inline scripts) AND `window.ethereum` was
 * already exposed at that point — meaning the synchronous inline injection
 * path succeeded. It is `false` when the inline capture was blocked by CSP,
 * indicating the inpage script fell back to the asynchronous Blob URL
 * injection.
 *
 * @param driver - Selenium driver wrapper
 */
async function wasEthereumAvailableDuringPageLoad(
  driver: Driver,
): Promise<unknown> {
  return await driver.executeScript(
    'return window.ethereumAvailableDuringPageLoad;',
  );
}

describe('Inpage script injection under page CSP', function (this: Suite) {
  before(function () {
    // The synchronous-inline injection path that this spec covers only ships
    // in MV2 builds. MV3 (Chrome) registers `inpage.js` as a `world: "MAIN"`
    // content script which bypasses page CSP entirely, so the regression
    // this spec guards against is Firefox-only.
    if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
      this.skip();
    }
  });

  it('exposes window.ethereum on a page with no CSP via the synchronous inline injection', async function () {
    await withFixtures(
      {
        dappOptions: { customDappPaths: [CUSTOM_DAPP_PATH] },
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        await waitForProviderInjection(driver);

        assert.equal(
          await isMetaMaskProviderInjected(driver),
          true,
          'window.ethereum was not injected on a page without CSP — the synchronous inline injection path is broken.',
        );

        assert.equal(
          await wasEthereumAvailableDuringPageLoad(driver),
          true,
          'window.ethereum was not available during page load on a page without CSP — the synchronous inline injection path did not run before the page parsed its first script.',
        );
      },
    );
  });

  it('exposes window.ethereum on a page whose script-src-elem CSP blocks the inline injection via the Blob URL fallback', async function () {
    await withFixtures(
      {
        dappOptions: { customDappPaths: [CUSTOM_DAPP_PATH] },
        staticServerOptions: {
          headers: [
            {
              source: 'index.html',
              headers: [
                {
                  key: 'Content-Security-Policy',
                  value: FALLBACK_FORCING_CSP,
                },
              ],
            },
          ],
        },
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        await waitForProviderInjection(driver);

        assert.equal(
          await isMetaMaskProviderInjected(driver),
          true,
          `window.ethereum was not injected on a page with "Content-Security-Policy: ${FALLBACK_FORCING_CSP}" — the Blob URL fallback path is broken.`,
        );

        assert.equal(
          await wasEthereumAvailableDuringPageLoad(driver),
          false,
          `window.ethereum should not have been available during page load on a page with "Content-Security-Policy: ${FALLBACK_FORCING_CSP}" — the synchronous inline injection should be blocked, forcing the asynchronous Blob URL fallback.`,
        );
      },
    );
  });
});
