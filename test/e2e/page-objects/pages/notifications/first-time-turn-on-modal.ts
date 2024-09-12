import { testId } from '../../../../../ui/selectors/util';
import { Driver } from '../../../webdriver/driver';

class FirstTimeTurnOnNotificationsModal {
  private driver: Driver;

  private readonly turnOnButton = testId('turn-on-notifications-button');

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
    await this.driver.clickElement(this.turnOnButton);
  }
}

export default FirstTimeTurnOnNotificationsModal;
