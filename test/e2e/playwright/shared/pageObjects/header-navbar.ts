import { type Locator, type Page, expect } from '@playwright/test';

export class HeaderNavbar {
  readonly page: Page;
  readonly accountMenuButton: Locator;
  readonly threeDotMenuButton: Locator;
  readonly settingsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountMenuButton = this.page.getByTestId('account-menu-icon');
    this.threeDotMenuButton = this.page.getByTestId('account-options-menu-button');
    this.settingsButton = this.page.getByTestId('global-menu-settings');
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking header navbar is loaded');
    await expect(this.accountMenuButton).toBeVisible();
    await expect(this.threeDotMenuButton).toBeVisible();
    console.log('Header navbar is loaded');
  }

  async openThreeDotMenu(): Promise<void> {
    console.log('Open account options menu');
    await this.threeDotMenuButton.click();
  }

  async openSettingsPage(): Promise<void> {
    console.log('Open settings page');
    await this.openThreeDotMenu();
    await this.settingsButton.click();
  }
}