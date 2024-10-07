import { Driver } from '../../../webdriver/driver';

class FirstTimeTurnOnNotificationsModal {
  private driver: Driver;

  private readonly turnOnButton =
    '[data-testid="turn-on-notifications-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.turnOnButton);
    } catch (e) {
      console.log(
        'Timeout while waiting for TurnOnNotificationsModal to be loaded',
        e,
      );
      throw e;
    }
    console.log('TurnOnNotificationsModal is loaded');
  }

  async clickTurnOnNotifications(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.turnOnButton, 10000);
  }
}

export default FirstTimeTurnOnNotificationsModal;
