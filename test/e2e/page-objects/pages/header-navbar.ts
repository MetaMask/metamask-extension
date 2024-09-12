import { testId } from '../../../../ui/selectors/util';
import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  private driver: Driver;

  private accountMenuButton: string;
  private accountOptionsMenuButton: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.accountMenuButton = testId('account-menu-icon');
    this.accountOptionsMenuButton = testId('account-options-menu-button');
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
  }

  async openAccountOptionsMenu(): Promise<void> {
    await this.driver.clickElement(this.accountOptionsMenuButton);
  }
}

export default HeaderNavbar;
