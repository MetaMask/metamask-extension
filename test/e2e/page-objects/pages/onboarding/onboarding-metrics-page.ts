import { Driver } from '../../../webdriver/driver';

class OnboardingMetricsPage {
  private driver: Driver;

  private readonly continueButton = '[data-testid="metametrics-i-agree"]';

  private readonly dataCollectionForMarketingCheckbox =
    '[data-testid="metametrics-data-collection-checkbox"]';

  private readonly dataParticipateInMetaMetricsCheckbox =
    '[data-testid="metametrics-checkbox"]';

  private readonly dataCollectionForMarketingCheckedState =
    'input[type="checkbox"]#metametrics-datacollection-opt-in:checked';

  private readonly dataParticipateInMetaMetricsCheckedState =
    'input[type="checkbox"]#metametrics-opt-in:checked';

  private readonly dataParticipateInMetaMetricsUncheckedState =
    'input[type="checkbox"]#metametrics-opt-in:not(:checked)';

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
    await this.driver.waitForSelector(
      this.dataCollectionForMarketingCheckedState,
    );
  }

  async validateParticipateInMetaMetricsIsChecked(): Promise<void> {
    await this.driver.waitForSelector(
      this.dataParticipateInMetaMetricsCheckedState,
    );
  }

  async validateParticipateInMetaMetricsIsUnchecked(): Promise<void> {
    await this.driver.waitForSelector(
      this.dataParticipateInMetaMetricsUncheckedState,
    );
  }

  async skipMetricAndContinue(): Promise<void> {
    await this.driver.clickElement(this.dataParticipateInMetaMetricsCheckbox);
    await this.driver.clickElement(this.continueButton);
  }
}

export default OnboardingMetricsPage;
