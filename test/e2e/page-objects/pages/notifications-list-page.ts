import { Driver } from '../../webdriver/driver';

class NotificationsListPage {
  private driver: Driver;

  private readonly notificationsListPageTitle = {
    text: 'Notifications',
    dataTestId: 'notifications-settings-title',
  };

  private readonly notificationsSettingsButton =
    '[data-testid="notifications-settings-button"]';

  private readonly notificationListItem = (id: string) =>
    `[data-testid="notification-list-item-${id}"]`;

  private readonly snapsNotificationMessage =
    '.snap-notifications__item__details__message';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.notificationsListPageTitle,
        this.notificationsSettingsButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Notifications list page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Notifications List page is loaded');
  }

  /**
   * Navigates to the notifications settings page.
   *
   * This method clicks on the notifications settings button to navigate to the settings page.
   */
  async goToNotificationsSettings(): Promise<void> {
    console.log(
      `On notifications list page, navigating to notifications settings`,
    );
    await this.driver.clickElement(this.notificationsSettingsButton);
  }

  async checkSnapsNotificationMessage(expectedMessage: string): Promise<void> {
    console.log('Checking snap notification message');
    await this.driver.waitForSelector({
      css: this.snapsNotificationMessage,
      text: expectedMessage,
    });
  }

  async clickSpecificNotificationMessage(message: string): Promise<void> {
    console.log('Clicking specific notification message in the list');
    await this.driver.clickElement({
      css: this.snapsNotificationMessage,
      text: message,
    });
  }

  async checkNotificationItemByTestId(id: string) {
    console.log('Checking notification list item by id');
    await this.driver.scrollToElement(
      await this.driver.waitForSelector(this.notificationListItem(id)),
    );
  }

  async clickNotificationItemByTestId(id: string) {
    console.log('Clicking notification list item by id');
    await this.driver.clickElement(this.notificationListItem(id));
  }
}

export default NotificationsListPage;
