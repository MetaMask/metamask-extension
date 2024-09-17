import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  private driver: Driver;

  private accountMenuButton: string;

  private accountOptionMenu: string;

  private lockMetaMaskButton: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.accountMenuButton = '[data-testid="account-menu-icon"]';
    this.accountOptionMenu = '[data-testid="account-options-menu-button"]';
    this.lockMetaMaskButton = '[data-testid="global-menu-lock"]';
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
  }

  async lockMetaMask(): Promise<void> {
    await this.driver.clickElement(this.accountOptionMenu);
    await this.driver.clickElement(this.lockMetaMaskButton);
  }
}

export default HeaderNavbar;
