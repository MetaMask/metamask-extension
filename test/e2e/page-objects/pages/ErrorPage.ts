import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from './header-navbar';
import SettingsPage from './settings-page';
import DevelopOptions from './deveoper-options';

class ErrorPage {
  private readonly driver: Driver;

  // Locators
  private readonly errorPageTitle: object = {
    text: 'MetaMask encountered an error',
    css: 'h3',
  };

  private readonly errorMessage = '[data-testid="error-page-error-message"]';

  private readonly sendReportToSentryButton =
    '[data-testid="error-page-describe-what-happened-button"]';

  private readonly sentryReportForm = '#sentry-feedback';

  private readonly contactSupportButton =
    '[data-testid="error-page-contact-support-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.errorPageTitle);
    } catch (e) {
      console.log('Timeout while waiting for Error page to be loaded', e);
      throw e;
    }
    console.log('Error page is loaded');
  }

  async triggerPageCrash(): Promise<void> {
    const headerNavbar = new HeaderNavbar(this.driver);
    await headerNavbar.openSettingsPage();
    const settingsPage = new SettingsPage(this.driver);
    await settingsPage.check_pageIsLoaded();
    await settingsPage.goToDevelopOptionSettings();

    const developOptionsPage = new DevelopOptions(this.driver);
    await developOptionsPage.check_pageIsLoaded();
    await developOptionsPage.clickGenerateCrashButton();
  }

  async validate_errorMessage(): Promise<void> {
    const errorMessageTextDOM = await this.driver.waitForSelector(
      this.errorMessage,
    );
    const errorMessageText = await errorMessageTextDOM.getText();
    assert.equal(
      errorMessageText,
      `Message: Unable to find value of key "developerOptions" for locale "en"`,
      `Error in loading error page`,
    );
  }

  async submitToSentryUserFeedbackForm(): Promise<void> {
    console.log(`Open sentry user feedback form in error page`);
    await this.driver.clickElement(this.sendReportToSentryButton);
    await this.driver.waitForSelector(this.sentryReportForm);
  }

  async contactAndValidateMetamaskSupport(): Promise<void> {
    console.log(`Contact metamask support form in a separate page`);
    await this.driver.clickElement(this.contactSupportButton);
    // metamask, help page
    await this.driver.waitUntilXWindowHandles(2);
  }
}

export default ErrorPage;
