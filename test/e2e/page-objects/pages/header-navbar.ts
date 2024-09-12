import { testId } from '../../../../ui/selectors/util';
import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  private driver: Driver;

  private accountMenuButton: string;
  private accountOptionsMenuButton: string;
  private lockMetaMaskButton: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.lockMetaMaskButton = testId('global-menu-lock');
    this.accountMenuButton = testId('account-menu-icon');
    this.accountOptionsMenuButton = testId('account-options-menu-button');
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
  }

  async openAccountOptionsMenu(): Promise<void> {
    await this.driver.clickElement(this.accountOptionsMenuButton);
  }

  async lockMetaMask(): Promise<void> {
    await this.openAccountOptionsMenu();
    await this.driver.clickElement(this.lockMetaMaskButton);
  }
}

export default HeaderNavbar;
