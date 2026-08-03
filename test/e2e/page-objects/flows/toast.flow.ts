import { Driver } from '../../webdriver/driver';

const TOAST_POLL_MS = 200;
const TOAST_POLL_DURATION_MS = 4000;
/** Exit early once the toast layer stays clear for this long. */
const TOAST_CLEAR_STABLE_MS = 800;

async function isObstructingToastVisible(driver: Driver): Promise<boolean> {
  return Boolean(
    await driver.executeScript(
      'return Boolean(document.querySelector(".toast-container > div"));',
    ),
  );
}

/**
 * Dismisses visible toast notifications via script to avoid pointer-events issues.
 * Also removes any remaining toast nodes so they cannot intercept clicks.
 * @param driver
 */
export async function dismissVisibleToasts(driver: Driver): Promise<void> {
  await driver.executeScript(`
    document
      .querySelectorAll('.toast-container button[aria-label="Close"]')
      .forEach((button) => button.click());
    document
      .querySelectorAll('.toast-container > div')
      .forEach((toast) => toast.remove());
  `);
  await driver.delay(300);
}

/**
 * Polls for transaction toasts that appear while the network picker is open.
 * Pending Tron txs often fire a toast during the non-EVM snap delay; dismiss any
 * that are already up, then keep watching briefly for late arrivals.
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
