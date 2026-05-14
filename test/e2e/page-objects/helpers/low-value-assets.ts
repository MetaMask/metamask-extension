import type { Driver } from '../../webdriver/driver';

const LOW_VALUE_ASSETS_TOGGLE_SELECTOR =
  '[data-testid="low-value-assets-toggle"]';

/**
 * Expands the low value assets group when present so token row lookups include
 * rows under the sub-$1 / unknown-fiat threshold. No-op when absent or already
 * expanded.
 *
 * @param driver - E2E driver.
 */
export async function expandLowValueAssetsIfPresent(
  driver: Driver,
): Promise<void> {
  const isPresent = await driver.isElementPresent({
    css: LOW_VALUE_ASSETS_TOGGLE_SELECTOR,
  });
  if (!isPresent) {
    return;
  }

  const toggle = await driver.findElement(LOW_VALUE_ASSETS_TOGGLE_SELECTOR);
  const ariaExpanded = await toggle.getAttribute('aria-expanded');
  if (ariaExpanded === 'true') {
    return;
  }

  await driver.clickElement(LOW_VALUE_ASSETS_TOGGLE_SELECTOR);
}
