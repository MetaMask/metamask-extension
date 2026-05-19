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
  await driver.executeScript(`
    const toggle = document.querySelector(${JSON.stringify(
      LOW_VALUE_ASSETS_TOGGLE_SELECTOR,
    )});
    if (!(toggle instanceof HTMLElement)) {
      return;
    }

    if (toggle.getAttribute('aria-expanded') === 'true') {
      return;
    }

    toggle.click();
  `);
}
