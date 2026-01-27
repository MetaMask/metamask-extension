import { Browser } from 'selenium-webdriver';

/**
 * Skips the current test if running on Firefox.
 * Backup & Sync (accounts / contacts syncing) tests are flaky on Firefox due to timing issues.
 *
 * @param context - The Mocha test context (this)
 */
export function skipOnFirefox(context: Mocha.Context): void {
  if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
    console.log('Skipping test on Firefox due to timing issues');
    context.skip();
  }
}
