import { Driver } from '../../../../webdriver/driver';

export class Navigation {
  protected driver: Driver;

  private readonly navigationNextButton =
    '[data-testid="confirm-nav__next-confirmation"]';

  private readonly navigationPreviousButton =
    '[data-testid="confirm-nav__previous-confirmation"]';

  private readonly navigationPosition = '[data-testid="confirm-nav__position"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_currentPosition(current: number, total: number): Promise<void> {
    try {
      await this.driver.waitForSelector({
        css: this.navigationPosition,
        text: `${current} of ${total}`,
      });
    } catch (e) {
      console.log('Timeout while waiting for expected navigation position', e);
      throw e;
    }
  }

  async clickNavigationNextButton() {
    await this.driver.clickElement(this.navigationNextButton);
  }

  async clickNavigationPreviousButton() {
    await this.driver.clickElement(this.navigationPreviousButton);
  }
}
