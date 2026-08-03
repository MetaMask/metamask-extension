import { Driver } from '../../webdriver/driver';

/**
 * Close button for react-hot-toast notifications (transaction pending/success/etc).
 * Same selector used by homepage and confirmation page objects.
 */
export const TOAST_CLOSE_BUTTON = '.toast-container button[aria-label="Close"]';

/**
 * Dismisses a visible toast if present. No-op when absent.
 * Mirrors the Perps / homepage pattern: {@link Driver.clickElementSafe}.
 *
 * @param driver - WebDriver instance
 * @param timeout - How long to wait for a toast close button before giving up
 */
export async function dismissVisibleToasts(
  driver: Driver,
  timeout = 2_000,
): Promise<void> {
  await driver.clickElementSafe(TOAST_CLOSE_BUTTON, timeout);
}
