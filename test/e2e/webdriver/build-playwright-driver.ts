import { launchMetaMaskChromeExtension } from '../playwright/shared/chrome-extension-harness';
import { launchMetaMaskFirefoxExtension } from '../playwright/shared/firefox-extension-harness';
import {
  PlaywrightDriver,
  type PlaywrightDriverBrowser,
} from './driver-playwright';

export type BuildPlaywrightDriverOptions = {
  browser: PlaywrightDriverBrowser;
  extensionDirectory?: string;
  headless?: boolean;
  timeout?: number;
  /**
   * Optional extra Chromium command-line arguments. Forwarded to the
   * Chrome harness when `browser === 'chrome'`. Useful for proxy
   * configuration in conjunction with the e2e mock server.
   */
  extraArgs?: string[];
  /**
   * Optional Firefox RDP port. Forwarded to the Firefox harness when
   * `browser === 'firefox'`. Allows running multiple Firefox shards in
   * parallel.
   */
  rdpPort?: number;
  /**
   * Optional mock-server port. Forwarded to both harnesses so the browser
   * routes traffic through mockttp. Defaults to 8000 (matches Selenium and
   * `helpers.js`).
   */
  proxyPort?: number;
};

export type PlaywrightDriverHarness = {
  driver: PlaywrightDriver;
  cleanup: () => Promise<void>;
};

/**
 * Launches Playwright with the MetaMask extension loaded and wraps it in
 * the `PlaywrightDriver` shim. The shape of the returned object mirrors
 * what the Selenium driver builders return so `withFixtures` can dispatch
 * between the two via a `driverType` option.
 *
 * @param options - Harness options.
 */
export async function buildPlaywrightDriver(
  options: BuildPlaywrightDriverOptions,
): Promise<PlaywrightDriverHarness> {
  const {
    browser,
    timeout,
    extensionDirectory,
    headless,
    extraArgs,
    rdpPort,
    proxyPort,
  } = options;

  const harness =
    browser === 'firefox'
      ? await launchMetaMaskFirefoxExtension({
          extensionDirectory,
          headless,
          rdpPort,
          proxyPort,
        })
      : await launchMetaMaskChromeExtension({
          extensionDirectory,
          headless,
          extraArgs,
          proxyPort,
        });

  const driver = new PlaywrightDriver({
    context: harness.context,
    page: harness.page,
    browser,
    extensionId: harness.extensionId,
    extensionUrl: harness.extensionUrl,
    timeout,
  });

  return {
    driver,
    cleanup: async () => {
      await driver.quit().catch(() => undefined);
      await harness.cleanup().catch(() => undefined);
    },
  };
}
