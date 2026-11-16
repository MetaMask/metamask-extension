import { Driver } from '../../../webdriver/driver';

/**
 * Download the mobile app step, shown after social login onboarding.
 *
 * Screen: `#/onboarding/download-app`.
 * Owns: page load checks and the continue button.
 * Boundaries: this step only. Continue opens the completion screen, which
 * belongs to `OnboardingCompletePage`.
 * Related: `OnboardingCompletePage`, `flows/onboarding.flow.ts`.
 *
 * @see ui/pages/onboarding-flow/download-app/download-app.tsx
 */
class DownloadAppPage {
  private readonly continueButton = '[data-testid="download-app-continue"]';

  private readonly downloadAppPage = '[data-testid="onboarding-download-app"]';

  private readonly downloadAppTitle = {
    text: 'Scan QR code and download the app',
    tag: 'h2',
  };

  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.downloadAppPage,
        this.downloadAppTitle,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for download app page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Download app page is loaded');
  }

  async clickContinue(): Promise<void> {
    console.log('Click continue on download app page');
    await this.driver.clickElementAndWaitToDisappear(this.continueButton);
  }
}

export default DownloadAppPage;
