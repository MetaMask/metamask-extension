import { Driver } from '../../webdriver/driver';

class AccountOptionsMenu {
  private driver: Driver;

  private readonly notificationsMenuItem =
    '[data-testid="notifications-menu-item"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickNotificationsMenuItem(): Promise<void> {
    await this.driver.clickElement(this.notificationsMenuItem);
  }
}

export default AccountOptionsMenu;
