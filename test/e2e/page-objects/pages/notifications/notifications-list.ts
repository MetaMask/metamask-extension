import { testId } from '../../../../../ui/selectors/util';
import { Driver } from '../../../webdriver/driver';

class NotificationsListPage {
  private driver: Driver;

  private readonly backButton = testId('back-button');

  private readonly notificationsSettingsButton = testId(
    'notifications-settings-button',
  );

  private readonly noNotificationsReceivedPlaceholder = testId(
    'notifications-list-placeholder',
  );

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
    await this.driver.waitForSelector(this.noNotificationsReceivedPlaceholder);
  }
}

export default NotificationsListPage;
