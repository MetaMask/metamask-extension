import type { Driver } from '../../webdriver/driver';

const LOW_VALUE_ASSETS_TOGGLE_SELECTOR =
  '[data-testid="low-value-assets-toggle"]';

const LOW_VALUE_ASSETS_TOGGLE_EXPANDED_SELECTOR = `${LOW_VALUE_ASSETS_TOGGLE_SELECTOR}[aria-expanded="true"]`;

/**
 * Expands the low value assets group when present so token row lookups include
 * rows under the sub-$1 threshold. No-op when absent or already expanded.
 *
 * @param driver - E2E driver.
 */
export async function expandLowValueAssetsIfPresent(
  driver: Driver,
): Promise<void> {
  let toggle;

  try {
    toggle = await driver.findElement(LOW_VALUE_ASSETS_TOGGLE_SELECTOR, 1000);
  } catch {
    return;
  }

  if ((await toggle.getAttribute('aria-expanded')) === 'true') {
    return;
  }

  await driver.clickElement(LOW_VALUE_ASSETS_TOGGLE_SELECTOR);
  await driver.waitForSelector(LOW_VALUE_ASSETS_TOGGLE_EXPANDED_SELECTOR, {
    timeout: 5000,
  });
}
