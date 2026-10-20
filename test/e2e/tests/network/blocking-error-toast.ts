import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  getBlockingErrorToastHeartbeat,
  getRecordedBlockingErrorToasts,
  installBlockingErrorToastMonitor,
} from '../../helpers/blocking-error-toast-monitor';

/**
 * Installs a page-side poller that records blocking error toasts as they
 * appear, including ones that auto-dismiss before a later assertion.
 * Polls instead of using MutationObserver, which LavaMoat scuttling blocks.
 * Idempotent on the current document; call again after unlock in case the
 * document reloaded.
 *
 * @param driver - WebDriver for the extension UI.
 */
export async function startMonitoringBlockingErrorToast(
  driver: Driver,
): Promise<void> {
  console.log('Start monitoring homepage for blocking error toasts');
  await driver.executeScript(installBlockingErrorToastMonitor);
}

/**
 * Fails if the toast poll never ran, or if
 * {@link startMonitoringBlockingErrorToast} recorded the price-api message,
 * then re-checks that it is not currently displayed.
 *
 * The monitor only records `.toast-container` text that includes
 * `cryptocurrencies` or `unsupported`. The visible-toast assertion stays on
 * `HomePage`.
 *
 * @param driver - WebDriver for the extension UI.
 * @param homePage - Homepage page object for the visible-toast assertion.
 */
export async function checkNoBlockingErrorToastWasObserved(
  driver: Driver,
  homePage: HomePage,
): Promise<void> {
  console.log(
    'Check no price-api error toast was observed during homepage load',
  );
  const heartbeat = (await driver.executeScript(
    getBlockingErrorToastHeartbeat,
  )) as number;
  assert.notStrictEqual(
    heartbeat,
    0,
    'Blocking error toast monitor poll did not run',
  );
  await homePage.checkNoErrorToastIsDisplayed();
  const seen = (await driver.executeScript(
    getRecordedBlockingErrorToasts,
  )) as string[];
  const priceApiToasts = seen.filter(
    (text) => text.includes('cryptocurrencies') || text.includes('unsupported'),
  );
  assert.deepEqual(priceApiToasts, []);
}
