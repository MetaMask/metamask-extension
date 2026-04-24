import { until } from 'selenium-webdriver';
import { Driver, PAGES } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../constants';

class CriticalErrorPage {
  protected readonly driver: Driver;

  // Locators
  protected readonly errorPageTitle: object = {
    text: 'MetaMask had trouble starting.',
    css: 'h1',
  };

  protected readonly errorMessage = '.critical-error__details';

  protected readonly troubleStartingDescription =
    'This error could be intermittent, so try restarting the extension.';

  protected readonly restoreAccountsLink = '#critical-error-restore-link';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check that the page has loaded.
   *
   * @param timeoutMs - Optional timeout in ms. Use a long value (e.g. 60s) when
   * waiting for the page after init/state sync timeout, to allow phase timeouts to fire.
   */
  async checkPageIsLoaded(timeoutMs?: number): Promise<void> {
    try {
      const options =
        timeoutMs === undefined ? undefined : { timeout: timeoutMs };
      await this.driver.waitForSelector(this.errorPageTitle, options);
    } catch (e) {
      console.log(
        'Timeout while waiting for critical error page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Critical error page is loaded');
  }

  /**
   * Validate that the description on the page is for the "trouble starting" scenario.
   */
  async validateTroubleStartingDescription(): Promise<void> {
    await this.driver.waitForSelector({
      text: this.troubleStartingDescription,
    });
  }

  /**
   * Validate that the given error message is shown.
   *
   * @param errorMessage - The error message to check for.
   */
  async validateErrorMessage(errorMessage: string): Promise<void> {
    await this.driver.waitForSelector({
      text: errorMessage,
      css: this.errorMessage,
    });
  }

  /**
   * Click the "Attempt recovery" link (shown on critical error when backup exists)
   * and handle the confirmation alert.
   *
   * @param options - Options for the attempt recovery action.
   * @param options.confirm - Whether to confirm (accept) or dismiss the alert.
   */
  async clickAttemptRecoveryLink({
    confirm,
  }: {
    confirm: boolean;
  }): Promise<void> {
    console.log(
      `Click Attempt recovery link and ${confirm ? 'confirm' : 'dismiss'} the alert`,
    );

    await this.driver.waitForSelector(this.restoreAccountsLink);
    await this.driver.clickElement(this.restoreAccountsLink);

    await this.driver.driver.wait(until.alertIsPresent(), 20000);
    const alert = await this.driver.driver.switchTo().alert();

    if (confirm) {
      await alert.accept();

      // runtime.reload() kills extension tabs, so the driver's current window
      // handle is stale. Wait for the reload, then reattach to a surviving tab.
      await this.driver.delay(3000);
      const handles = await this.driver.driver.getAllWindowHandles();
      await this.driver.driver.switchTo().window(handles[0]);

      await this.waitForPageAfterExtensionReload({
        timeoutMs: 30_000,
        waitForLoadingLogoToDisappear: false,
      });

      // The service worker handoff runs asynchronously after runtime.reload():
      // it reads the restore session from storage.local, converts the
      // metamask.io/restoring tab to home.html, then clears the key. We must
      // wait for that key to be cleared before closing extra tabs — otherwise
      // we kill the restoring tab before the service worker can hand it off,
      // causing a fallback that opens a second home.html tab.
      await this.driver.waitUntil(
        async () => {
          const cleared = await this.driver.executeScript(`
            return new Promise(resolve => {
              const b = globalThis.browser ?? globalThis.chrome;
              b.storage.local.get('criticalErrorRestore', (data) => {
                resolve(!data.criticalErrorRestore);
              });
            });
          `);
          return Boolean(cleared);
        },
        { interval: 300, timeout: 30_000 },
      );

      // Now safe to close extra tabs (service worker has finished handoff / fallback).
      await this.driver.closeAllOtherTabs();
    } else {
      await alert.dismiss();
    }
  }

  /**
   * Wait for the critical error page to be available after reloading the extension.
   * Since reloading the background restarts the extension, the UI isn't
   * available immediately. This method keeps reloading until it is.
   *
   * @param options - Options.
   * @param options.timeoutMs - How long to wait. Use a long value (e.g. 60s) for
   * init/state-sync timeout flows; vault recovery uses 10s. Default 10000.
   * @param options.waitForLoadingLogoToDisappear - If true (default), assert the
   * loading logo is not present before returning. Set to false for init/state-sync
   * timeout flows, where the UI shows a ~15s loading spinner before the critical error.
   */
  async waitForPageAfterExtensionReload({
    timeoutMs = 10000,
    waitForLoadingLogoToDisappear = true,
  }: {
    timeoutMs?: number;
    waitForLoadingLogoToDisappear?: boolean;
  } = {}): Promise<void> {
    console.log('Wait for critical error page after extension reload');
    await this.driver.waitUntil(
      async () => {
        await this.driver.navigate(PAGES.HOME, { waitForControllers: false });
        const title = await this.driver.driver.getTitle();
        // the browser will return an error message for our UI's HOME page until
        // the extension has restarted
        return title === WINDOW_TITLES.ExtensionInFullScreenView;
      },
      // reload and check title as quickly as possible
      { interval: 100, timeout: timeoutMs },
    );
    if (waitForLoadingLogoToDisappear) {
      await this.driver.assertElementNotPresent('.loading-logo', {
        timeout: 10000,
      });
    }
  }
}

export default CriticalErrorPage;
