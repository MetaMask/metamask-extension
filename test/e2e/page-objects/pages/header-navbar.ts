import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  private driver: Driver;

  private accountMenuButton: string;

  private accountOptionsMenuButton: string;

  private lockMetaMaskButton: string;

  private notificationsMenuItem: string;


  constructor(driver: Driver) {
    this.driver = driver;
    this.lockMetaMaskButton = '[data-testid="global-menu-lock"]';
    this.accountMenuButton = '[data-testid="account-menu-icon"]';
    this.accountOptionsMenuButton =
      '[data-testid="account-options-menu-button"]';
    this.notificationsMenuItem = '[data-testid="notifications-menu-item"]'
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
  }

  async lockMetaMask(): Promise<void> {
    await this.driver.clickElement(this.accountOptionsMenuButton);
    await this.driver.clickElement(this.lockMetaMaskButton);
  }

  async goToNotifiationsList(): Promise<void> {
    await this.driver.clickElement(this.accountOptionsMenuButton);
    await this.driver.clickElement(this.notificationsMenuItem)
  }
}

export default HeaderNavbar;
