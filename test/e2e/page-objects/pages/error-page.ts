import { Driver } from '../../webdriver/driver';
import HeaderNavbar from './header-navbar';
import SettingsPage from './settings-page';
import DevelopOptionsPage from './developer-options-page';
import { MockedEndpoint } from 'mockttp';
import { strict as assert } from 'assert';

const WAIT_FOR_SENTRY_MS = 5000;
const FEEDBACK_MESSAGE =
  'Message: Unable to find value of key "developerOptions" for locale "en"';

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

  private readonly sentryReportForm =
    '[data-testid="error-page-sentry-feedback-modal"]';

  private readonly contactSupportButton =
    '[data-testid="error-page-contact-support-button"]';

  private readonly sentryFeedbackTextarea =
    '[data-testid="error-page-sentry-feedback-textarea"]';

  private readonly sentryFeedbackSubmitButton =
    '[data-testid="error-page-sentry-feedback-submit-button"]';

  private readonly sentryFeedbackSuccessModal =
    '[data-testid="error-page-sentry-feedback-success-modal"]';

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

    const developOptionsPage = new DevelopOptionsPage(this.driver);
    await developOptionsPage.check_pageIsLoaded();
    await developOptionsPage.clickGenerateCrashButton();
  }

  async validate_errorMessage(): Promise<void> {
    await this.driver.waitForSelector({
      text: `Message: Unable to find value of key "developerOptions" for locale "en"`,
      css: this.errorMessage,
    });
  }

  async submitToSentryUserFeedbackForm(): Promise<void> {
    console.log(`Open sentry user feedback form in error page`);
    await this.driver.clickElement(this.sendReportToSentryButton);
    await this.driver.waitForSelector(this.sentryReportForm);
    await this.driver.fill(this.sentryFeedbackTextarea, FEEDBACK_MESSAGE);
    await this.driver.clickElementAndWaitToDisappear(
      this.sentryFeedbackSubmitButton,
    );
  }

  async contactAndValidateMetaMaskSupport(): Promise<void> {
    console.log(`Contact metamask support form in a separate page`);
    await this.driver.waitUntilXWindowHandles(1);
    await this.driver.clickElement(this.contactSupportButton);
    // metamask, help page
    await this.driver.waitUntilXWindowHandles(2);
  }

  async waitForSentryRequestSent(
    mockedEndpoint: MockedEndpoint,
  ): Promise<void> {
    console.log(`Wait for sentry request to be sent`);
    await this.driver.wait(async () => {
      const isPending = await mockedEndpoint.isPending();
      return !isPending;
    }, WAIT_FOR_SENTRY_MS);
    const [mockedRequest] = await mockedEndpoint.getSeenRequests();
    const mockTextBody = (await mockedRequest.body.getText()).split('\n');
    const mockJsonBody = JSON.parse(mockTextBody[2]);
    const feedbackBody = mockJsonBody.contexts.feedback['message'];
    const feedbackEventId =
      mockJsonBody.contexts.feedback['associated_event_id'];
    assert.equal(feedbackBody, FEEDBACK_MESSAGE);
    assert.ok(
      feedbackEventId,
      'feedbackEventId should not be null or undefined',
    );
  }

  async waitForSentrySuccessModal(): Promise<void> {
    await this.driver.waitForSelector(this.sentryFeedbackSuccessModal);
  }
}

export default ErrorPage;
