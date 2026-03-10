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
   * Click the "Restore accounts" link (shown on critical error when backup exists)
   * and handle the confirmation alert.
   *
   * @param options - Options for the restore action.
   * @param options.confirm - Whether to confirm (accept) or dismiss the alert.
   */
  async clickRestoreAccountsLink({
    confirm,
  }: {
    confirm: boolean;
  }): Promise<void> {
    console.log(
      `Click Restore accounts link and ${confirm ? 'confirm' : 'dismiss'} the alert`,
    );

    await this.driver.waitForSelector(this.restoreAccountsLink);
    await this.driver.clickElement(this.restoreAccountsLink);

    await this.driver.driver.wait(until.alertIsPresent(), 20000);
    const alert = await this.driver.driver.switchTo().alert();

    if (confirm) {
      await alert.accept();

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
