import { Driver } from "../../webdriver/driver";

const TOAST_POLL_MS = 200;
const TOAST_POLL_DURATION_MS = 4000;

async function isObstructingToastVisible(driver: Driver): Promise<boolean> {
  return Boolean(
    await driver.executeScript('return Boolean(document.querySelector(".toast-container > div"));'),
  );
}

/**
 * Dismisses visible toast notifications via script to avoid pointer-events issues.
 * Also removes any remaining toast nodes so they cannot intercept clicks.
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
 */
export async function dismissObstructingToastsBeforeClick(driver: Driver): Promise<void> {
  const deadline = Date.now() + TOAST_POLL_DURATION_MS;

  while (Date.now() < deadline) {
    if (await isObstructingToastVisible(driver)) {
      await dismissVisibleToasts(driver);
    }
    await driver.delay(TOAST_POLL_MS);
  }

  await dismissVisibleToasts(driver);
}
