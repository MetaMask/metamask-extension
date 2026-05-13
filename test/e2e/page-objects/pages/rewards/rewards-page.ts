import { Driver } from '../../../webdriver/driver';

export default class RewardsPage {
  protected readonly driver: Driver;

  private readonly rewardsModal = '[data-testid="rewards-modal"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.rewardsModal);
  }
}
