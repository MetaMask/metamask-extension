import { BasePage } from './base-page';
import { SettingsPage } from './settings-page';

export class HeaderNavbar extends BasePage {
  private accountMenuButton: string = '[data-testid="account-menu-icon"]';

  private settingsMenuButton: string = '[data-testid="global-menu-settings"]';

  private globalMenuButton: string =
    '[data-testid="account-options-menu-button"]';

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
