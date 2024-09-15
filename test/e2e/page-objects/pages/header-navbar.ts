import { Driver } from '../../webdriver/driver';
import { BasePage } from './base-page';
import { SettingsPage } from './settings-page';

class HeaderNavbar extends BasePage {
  private accountMenuButton: string;

  private settingsMenuButton: string;

  private globalMenuButton: string;

  constructor(driver: Driver) {
    super(driver);
    this.accountMenuButton = '[data-testid="account-menu-icon"]';
    this.globalMenuButton = '[data-testid="account-options-menu-button"]';
    this.settingsMenuButton = '[data-testid="global-menu-settings"]';
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
  }

  async openGlobalMenu(): Promise<void> {
    await this.driver.clickElement(this.globalMenuButton);
  }

  async openSettings(): Promise<SettingsPage> {
    await this.openGlobalMenu();
    await this.driver.clickElement(this.settingsMenuButton);
    return new SettingsPage(this.driver);
  }
}

export default HeaderNavbar;
