import { type Locator, type Page, expect } from '@playwright/test';

export class AboutPage {
  readonly page: Page;
  readonly aboutPageTitle: Locator;
  readonly metaMaskHeaderText: Locator;
  readonly metaMaskVersionHeader: Locator;
  readonly metaMaskVersionNumber: Locator;

  constructor(page: Page) {
    this.page = page;
    this.aboutPageTitle = this.page.locator('h4:has-text("About")');
    this.metaMaskHeaderText = this.page.locator('.info-tab__item').filter({ hasText: 'MetaMask is designed and built around the world.' });
    this.metaMaskVersionHeader = this.page.locator('.info-tab__version-header:has-text("MetaMask Version")');
    this.metaMaskVersionNumber = this.page.locator('.info-tab__version-number');
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking About page is loaded');
    await expect(this.aboutPageTitle).toBeVisible();
    await expect(this.metaMaskHeaderText).toBeVisible();
    await expect(this.metaMaskVersionHeader).toBeVisible();
    console.log('About page is loaded');
  }

  /**
   * Check the displayed MetaMask version is the expected version
   *
   * @param version - The expected version
   */
  async checkMetaMaskVersionNumber(version: string): Promise<void> {
    console.log('Checking displayed MetaMask version is', version);
    await expect(this.metaMaskVersionNumber).toHaveText(version);
  }
}