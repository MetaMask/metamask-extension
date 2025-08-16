import { type Locator, type Page, expect } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly aboutViewButton: Locator;
  readonly closeSettingsPageButton: Locator;
  readonly settingsPageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.aboutViewButton = this.page.locator('.tab-bar__tab__content__title:has-text("About")');
    this.closeSettingsPageButton = this.page.locator('.settings-page__header__title-container__close-button');
    this.settingsPageTitle = this.page.locator('h3:has-text("Settings")');
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check settings page is loaded');
    await expect(this.settingsPageTitle).toBeVisible();
  }

  async closeSettingsPage(): Promise<void> {
    console.log('Closing Settings page');
    await this.closeSettingsPageButton.click();
  }

  async goToAboutPage(): Promise<void> {
    console.log('Navigating to About page');
    await this.aboutViewButton.click();
  }
}