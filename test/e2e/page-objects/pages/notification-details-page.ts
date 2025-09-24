import { Driver } from '../../webdriver/driver';

class NotificationDetailsPage {
  private driver: Driver;

  private readonly detailsPageBackButton =
    '[data-testid="notification-details-back-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([this.detailsPageBackButton]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Notifications Details page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Notifications Details page is loaded');
  }

  async clickBackButton(): Promise<void> {
    console.log(
      `On notification details page, navigating back to notification list page`,
    );
    await this.driver.clickElement(this.detailsPageBackButton);
  }
}

export default NotificationDetailsPage;
