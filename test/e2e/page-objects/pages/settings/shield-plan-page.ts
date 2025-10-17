import { Driver } from '../../../webdriver/driver';

export default class ShieldPlanPage {
  private readonly driver: Driver;

  private readonly shieldPlanPageTitle = {
    text: 'Choose your plan',
    tag: 'h4',
  };

  private readonly shieldPlanPageAnnualPlan = {
    text: 'Annual',
    tag: 'p',
  };

  private readonly shieldPlanPageMonthlyPlan = {
    text: 'Monthly',
    tag: 'p',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.shieldPlanPageTitle,
      this.shieldPlanPageAnnualPlan,
      this.shieldPlanPageMonthlyPlan,
    ]);
    console.log('Shield plan page is loaded');
  }
}
