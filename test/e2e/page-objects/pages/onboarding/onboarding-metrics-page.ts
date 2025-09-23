import { Driver } from '../../../webdriver/driver';

class OnboardingMetricsPage {
  private driver: Driver;

  private readonly iAgreeButton = '[data-testid="metametrics-i-agree"]';

  private readonly dataCollectionForMarketingCheckbox =
    '[data-testid="metametrics-data-collection-checkbox"]';

  private readonly dataParticipateInMetaMetricsCheckbox =
    '[data-testid="metametrics-checkbox"]';

  private readonly dataCollectionForMarketingCheckedState =
    '.mm-checkbox__input--checked#metametrics-datacollection-opt-in';

  private readonly dataParticipateInMetaMetricsCheckedState =
    '.mm-checkbox__input--checked#metametrics-opt-in';

  private readonly metametricsMessage = {
    text: 'Help us improve MetaMask',
    tag: 'h2',
  };

  private readonly noThanksButton = '[data-testid="metametrics-i-agree"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.metametricsMessage,
        this.noThanksButton,
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

  async clickNoThanksButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.noThanksButton);
  }

  async clickIAgreeButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.iAgreeButton);
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
}

export default OnboardingMetricsPage;
