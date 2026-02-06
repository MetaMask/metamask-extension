import { until } from 'selenium-webdriver';
import { PAGES } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../constants';
import CriticalErrorPage from './critical-error-page';

/**
 * Page object for the vault recovery page.
 * This extends CriticalErrorPage as the recovery UI appears on the same
 * critical error page when a vault backup exists in IndexedDB.
 */
class VaultRecoveryPage extends CriticalErrorPage {
  // Locators
  readonly #recoveryButton = '#critical-error-button';

  // The vault recovery page has a different h1 than the critical error page
  readonly #vaultRecoveryPageTitle: object = {
    text: 'Internal error: database cannot be accessed',
    css: 'h1',
  };

  /**
   * Check that the page has loaded.
   * Overrides the parent method because the vault recovery page displays
   * "Internal error: database cannot be accessed" instead of the generic
   * "MetaMask had trouble starting." title that CriticalErrorPage expects.
   */
  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.#vaultRecoveryPageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for vault recovery page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Vault recovery page is loaded');
  }

  /**
   * Check that the recovery button is displayed.
   */
  async checkRecoveryButtonIsDisplayed(): Promise<void> {
    console.log('Check recovery button is displayed on vault recovery page');
    await this.driver.waitForSelector(this.#recoveryButton);
  }

  /**
   * Check that the recovery button is not present (e.g., right after confirming recovery).
   */
  async checkRecoveryButtonIsNotPresent(): Promise<void> {
    console.log('Check recovery button is not present on vault recovery page');
    await this.driver.assertElementNotPresent(this.#recoveryButton);
  }

  /**
   * Click the recovery/reset button and handle the confirmation alert.
   *
   * @param options - Options for the recovery action.
   * @param options.confirm - Whether to confirm (accept) or dismiss the alert.
   */
  async clickRecoveryButton({ confirm }: { confirm: boolean }): Promise<void> {
    console.log(
      `Click recovery button and ${confirm ? 'confirm' : 'dismiss'} the alert`,
    );

    // click the Recovery/Reset button
    await this.driver.waitForSelector(this.#recoveryButton);
    await this.driver.clickElement(this.#recoveryButton);

    // Wait for the confirmation alert to appear and handle it immediately
    await this.driver.driver.wait(until.alertIsPresent(), 20000);
    const alert = await this.driver.driver.switchTo().alert();

    if (confirm) {
      await alert.accept();
    } else {
      await alert.dismiss();
    }

    if (confirm) {
      // delay needed to mitigate a race condition where the tab is closed and re-opened after confirming, causing to window to become stale
      await this.driver.delay(3000);

      try {
        await this.driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
      } catch {
        // to mitigate a race condition where the tab is closed after confirming (issue #36916)
        await this.driver.openNewPage('about:blank');
        await this.driver.navigate();
      }

      // the button should be disabled if the user confirmed the prompt, but given this is a transient state that goes very fast
      // it can cause a race condition where the element becomes stale, so we check directly that the element is not present as that's a stable state that occurs eventually
      await this.checkRecoveryButtonIsNotPresent();
    } else {
      // the button should be enabled if the user dismissed the prompt
      // Wait for UI to settle after dismissing the alert
      await this.checkRecoveryButtonIsDisplayed();
    }
  }

  /**
   * Wait for the vault recovery page to be available after reloading the extension.
   * Since reloading the background restarts the extension, the UI isn't
   * available immediately. This method keeps reloading until it is.
   *
   * @param options - Optional configuration.
   * @param options.timeout - Timeout in milliseconds for waiting. Use a longer timeout
   * for tests that involve initialization timeouts (e.g., 25000ms for 10s init timeout).
   * Defaults to 10000ms.
   */
  async waitForPageAfterExtensionReload({
    timeout = 10000,
  }: { timeout?: number } = {}): Promise<void> {
    console.log(
      `Wait for vault recovery page after extension reload (timeout: ${timeout}ms)`,
    );
    await this.driver.waitUntil(
      async () => {
        await this.driver.navigate(PAGES.HOME, { waitForControllers: false });
        const title = await this.driver.driver.getTitle();
        // the browser will return an error message for our UI's HOME page until
        // the extension has restarted
        return title === WINDOW_TITLES.ExtensionInFullScreenView;
      },
      // reload and check title as quickly a possible
      { interval: 100, timeout },
    );
    await this.driver.assertElementNotPresent('.loading-logo', {
      timeout,
    });
  }
}

export default VaultRecoveryPage;
