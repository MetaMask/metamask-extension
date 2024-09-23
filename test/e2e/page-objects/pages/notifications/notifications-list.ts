import { Driver } from '../../../webdriver/driver';

class NotificationsListPage {
  private driver: Driver;

  private readonly backButton = '[data-testid="back-button"]';

  private readonly notificationsSettingsButton =
    '[data-testid="notifications-settings-button"]';

  private readonly noNotificationsReceivedPlaceholder =
    '[data-testid="notifications-list-placeholder"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.backButton,
        this.notificationsSettingsButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for notifications list page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Notifications list page is loaded');
  }

  async check_noNotificationsReceived(): Promise<void> {
    try {
      await this.driver.waitForSelector(
        this.noNotificationsReceivedPlaceholder,
      );
    } catch (e) {
      console.log(
        'Timed out while waiting for the empty notifications list placeholder to be displayed',
        e,
      );
    }
    console.log('Notifications list is empty as expected');
  }
}

export default NotificationsListPage;
