import { Driver } from '../../../webdriver/driver';

class OnboardingMetricsPage {
  private driver: Driver;

  private readonly continueButton = '[data-testid="metametrics-i-agree"]';

  private readonly dataCollectionForMarketingCheckbox =
    '[data-testid="metametrics-data-collection-checkbox"]';

  private readonly dataParticipateInMetaMetricsCheckbox =
    '[data-testid="metametrics-checkbox"]';

  private readonly participateVisualCheckbox =
    '[data-testid="metametrics-checkbox"] > div > div:last-child';

  private readonly marketingVisualCheckbox =
    '[data-testid="metametrics-data-collection-checkbox"] > div > div:last-child';

  private readonly metametricsMessage = {
    text: 'Help improve MetaMask',
    tag: 'h2',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.metametricsMessage,
        this.continueButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for onboarding metametrics page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Onboarding metametrics page is loaded');
  }

  async clickOnContinueButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.continueButton);
  }

  async clickDataCollectionForMarketingCheckbox(): Promise<void> {
    await this.driver.clickElement(this.dataCollectionForMarketingCheckbox);
  }

  async clickParticipateInMetaMetricsCheckbox(): Promise<void> {
    await this.driver.clickElement(this.dataParticipateInMetaMetricsCheckbox);
  }

  async validateDataCollectionForMarketingIsChecked(): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        const isChecked = await this.driver.executeScript(
          `return document.querySelector('${this.marketingVisualCheckbox}')` +
            `?.classList?.contains('bg-primary-default') ?? false`,
        );
        return isChecked === true;
      },
      { timeout: 10000, interval: 500 },
    );
  }

  async validateParticipateInMetaMetricsIsChecked(): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        const isChecked = await this.driver.executeScript(
          `return document.querySelector('${this.participateVisualCheckbox}')` +
            `?.classList?.contains('bg-primary-default') ?? false`,
        );
        return isChecked === true;
      },
      { timeout: 10000, interval: 500 },
    );
  }

  async validateParticipateInMetaMetricsIsUnchecked(): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        const isUnchecked = await this.driver.executeScript(
          `return document.querySelector('${this.participateVisualCheckbox}')` +
            `?.classList?.contains('bg-default') ?? false`,
        );
        return isUnchecked === true;
      },
      { timeout: 10000, interval: 500 },
    );
  }

  async skipMetricAndContinue(): Promise<void> {
    await this.driver.clickElement(this.dataParticipateInMetaMetricsCheckbox);
    await this.driver.clickElement(this.continueButton);
  }
}

export default OnboardingMetricsPage;
