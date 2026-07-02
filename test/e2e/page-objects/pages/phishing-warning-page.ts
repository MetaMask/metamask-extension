import { WebElement } from 'selenium-webdriver';
import { Driver } from '../../webdriver/driver';

class PhishingWarningPage {
  private readonly driver: Driver;

  private readonly backToSafetyButton = {
    text: 'Back to safety',
  };

  private readonly iframeSelector = 'iframe';

  private readonly openWarningInNewTabLink = '#open-self-in-new-tab';

  private readonly phishingWarningPageTitle = {
    text: 'This website might be harmful',
  };

  private readonly proceedAnywayButton = {
    testId: 'unsafe-continue-loaded',
  };

  private readonly reportDetectionProblemLink = {
    text: 'report a detection problem.',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.phishingWarningPageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Phishing Warning page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Phishing Warning page is loaded');
  }

  async clickBackToSafetyButton(): Promise<void> {
    console.log('Clicking back to safety button on phishing warning page');
    await this.driver.clickElementAndWaitToDisappear(this.backToSafetyButton);
  }

  async clickOpenWarningInNewTabLinkOnIframe(): Promise<void> {
    console.log(
      'Clicking open warning in new tab link on phishing warning page',
    );
    for (let i = 0; i < 3; i++) {
      try {
        console.log(`Finding iframe with retry ${i}`);
        const iframe = (await this.driver.findElement(
          this.iframeSelector,
        )) as WebElement;
        console.log('Switching to iframe');
        await this.driver.switchToFrame(iframe as unknown as string);
        await this.checkPageIsLoaded();
        console.log('Clicking open warning in new tab link');
        await this.driver.clickElement(this.openWarningInNewTabLink);
        try {
          console.log('Switching to default content');
          // Switch back to default content before retrying, in case we're stuck in the iframe context that was replaced on load
          await this.driver.switchToDefaultContent();
        } catch (error) {
          // context may already be discarded
        }
        return;
      } catch (error) {
        console.log(
          'Error clicking open warning in new tab link on phishing warning page',
          error,
        );
        if (error instanceof Error && error.name === 'NoSuchWindowError') {
          console.log(
            `Context may already be discarded, retrying ${i + 1}/3...`,
          );
        }
        await this.driver.delay(1000);
      }
    }
  }

  async clickProceedAnywayButton(): Promise<void> {
    console.log('Clicking proceed anyway button on phishing warning page');
    await this.driver.clickElement(this.proceedAnywayButton);
  }

  async clickReportDetectionProblemLink(): Promise<void> {
    console.log(
      'Clicking report detection problem link on phishing warning page',
    );
    await this.driver.clickElementAndWaitToDisappear(
      this.reportDetectionProblemLink,
    );
  }
}

export default PhishingWarningPage;
