import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  private driver: Driver;

  private accountMenuButton: string;

  private accountOptionMenu: string;

  private lockMetaMaskButton: string;

  private settingsButton: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.accountMenuButton = '[data-testid="account-menu-icon"]';
    this.accountOptionMenu = '[data-testid="account-options-menu-button"]';
    this.lockMetaMaskButton = '[data-testid="global-menu-lock"]';
    this.settingsButton = '[data-testid="settings-button"]';
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
  }

  async lockMetaMask(): Promise<void> {
    await this.driver.clickElement(this.accountOptionMenu);
    await this.driver.clickElement(this.lockMetaMaskButton);
  }

  async clickSettingsButton(): Promise<void> {
    console.log('Clicking settings button');
    try {
      await this.driver.clickElement(this.settingsButton);
      console.log('Settings button clicked successfully');
    } catch (error) {
      console.error('Failed to click settings button', error);
      throw new Error(`Unable to click settings button: ${(error as Error).message}`);
    }
  }
}

export default HeaderNavbar;
