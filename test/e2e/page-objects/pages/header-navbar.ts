import { Driver } from '../../webdriver/driver';
import AccountOptionsMenu from './account-options-menu';

class HeaderNavbar {
  private driver: Driver;

  private accountMenuButton: string;

  private accountOptionsMenuButton: string;

  private lockMetaMaskButton: string;

  private accountOptionsMenu: AccountOptionsMenu;

  constructor(driver: Driver) {
    this.driver = driver;
    this.lockMetaMaskButton = '[data-testid="global-menu-lock"]';
    this.accountMenuButton = '[data-testid="account-menu-icon"]';
    this.accountOptionsMenuButton =
      '[data-testid="account-options-menu-button"]';
    this.accountOptionsMenu = new AccountOptionsMenu(driver);
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

  async goToNotifiationsList(): Promise<void> {
    this.openAccountOptionsMenu();
    this.accountOptionsMenu.clickNotificationsMenuItem();
  }
}

export default HeaderNavbar;
