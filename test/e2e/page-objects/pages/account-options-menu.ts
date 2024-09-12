import { testId } from '../../../../ui/selectors/util';
import { Driver } from '../../webdriver/driver';

class AccountOptionsMenu {
  private driver: Driver;
  private readonly notificationsMenuItem = testId('notifications-menu-item');

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickNotificationsMenuItem(): Promise<void> {
    await this.driver.clickElement(this.notificationsMenuItem);
  }
}

export default AccountOptionsMenu;
