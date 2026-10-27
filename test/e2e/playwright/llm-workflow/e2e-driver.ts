import type { Page } from '@playwright/test';
import type { Driver } from '../../webdriver/driver';
import { PlaywrightDriver } from '../../webdriver/driver-playwright';

const DEFAULT_TIMEOUT_MS = 30_000;

const drivers = new WeakMap<Page, Driver>();

/**
 * Returns the e2e `PlaywrightDriver` bound to `page`, so llm-workflow code can
 * drive the e2e page objects instead of keeping its own selectors. One driver
 * is kept per page because each one subscribes to browser-context events.
 *
 * @param page - The page the page objects should act on.
 * @returns The driver, typed as the Selenium `Driver` the page objects take.
 */
export function getE2EDriver(page: Page): Driver {
  let driver = drivers.get(page);
  if (!driver) {
    const extensionId = extensionIdFromUrl(page.url());
    driver = new PlaywrightDriver({
      context: page.context(),
      page,
      browser: 'chrome',
      extensionId,
      extensionUrl: `chrome-extension://${extensionId}`,
      timeout: DEFAULT_TIMEOUT_MS,
    }) as unknown as Driver;
    drivers.set(page, driver);
  }
  return driver;
}

/**
 * Returns a view of `driver` whose default wait timeout is `timeout`, for
 * short probes that must not wait the full driver timeout.
 *
 * @param driver - The driver to wrap.
 * @param timeout - Default wait timeout in ms.
 * @returns The wrapped driver.
 */
export function withTimeout(driver: Driver, timeout: number): Driver {
  return new Proxy(driver, {
    get: (target, property, receiver) =>
      property === 'timeout'
        ? timeout
        : Reflect.get(target, property, receiver),
  });
}

function extensionIdFromUrl(url: string): string {
  return url.startsWith('chrome-extension://') ? new URL(url).host : '';
}
