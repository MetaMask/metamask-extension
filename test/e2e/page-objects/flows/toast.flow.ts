import { Driver } from '../../webdriver/driver';

const TOAST_POLL_MS = 200;
const TOAST_POLL_DURATION_MS = 4000;
/** Exit early once the toast layer stays clear for this long. */
const TOAST_CLEAR_STABLE_MS = 800;

/**
 * Returns true when a toast is still visible and able to intercept clicks.
 * Soft-hidden toasts (aria-hidden) are ignored — we must not DOM-remove them
 * because that races React's reconciler and can crash the UI.
 * @param driver
 */
async function isObstructingToastVisible(driver: Driver): Promise<boolean> {
  return Boolean(
    await driver.executeScript(`
      return Boolean(
        document.querySelector(
          '.toast-container > div:not([aria-hidden="true"])',
        ),
      );
    `),
  );
}

/**
 * Dismisses visible toast notifications via script to avoid pointer-events issues.
 * Soft-hides any remaining toast nodes so they cannot intercept clicks, without
 * removing them from the DOM (which breaks React's removeChild reconciler).
 *
 * @param driver
 */
export async function dismissVisibleToasts(driver: Driver): Promise<void> {
  await driver.executeScript(`
    document
      .querySelectorAll('.toast-container button[aria-label="Close"]')
      .forEach((button) => button.click());
    document.querySelectorAll('.toast-container > div').forEach((toast) => {
      toast.style.pointerEvents = 'none';
      toast.style.visibility = 'hidden';
      toast.setAttribute('aria-hidden', 'true');
    });
  `);
  await driver.delay(300);
}

/**
 * Polls for transaction toasts that appear while the network picker is open.
 * Pending Tron txs often fire a toast during the non-EVM snap delay; dismiss any
 * that are already up, then keep watching briefly for late arrivals.
 *
 * @param driver
 */
export async function dismissObstructingToastsBeforeClick(
  driver: Driver,
): Promise<void> {
  const deadline = Date.now() + TOAST_POLL_DURATION_MS;
  let clearSince: number | null = null;

  await dismissVisibleToasts(driver);

  while (Date.now() < deadline) {
    if (await isObstructingToastVisible(driver)) {
      await dismissVisibleToasts(driver);
      clearSince = null;
    } else if (clearSince === null) {
      clearSince = Date.now();
    } else if (Date.now() - clearSince >= TOAST_CLEAR_STABLE_MS) {
      return;
    }
    await driver.delay(TOAST_POLL_MS);
  }

  await dismissVisibleToasts(driver);
}
