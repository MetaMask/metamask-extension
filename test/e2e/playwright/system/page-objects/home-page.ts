import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly accountMenu: Locator;
  readonly assetTab: Locator;
  readonly activityTab: Locator;
  readonly balance: Locator;
  readonly sendButton: Locator;
  readonly receiveButton: Locator;
  readonly swapButton: Locator;
  readonly bridgeButton: Locator;
  readonly accountName: Locator;
  readonly networkSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountMenu = page.locator('[data-testid="account-menu-icon"]');
    this.assetTab = page.locator('[data-testid="account-overview__asset-tab"]');
    this.activityTab = page.locator('[data-testid="account-overview__activity-tab"]');
    this.balance = page.locator('[data-testid="eth-overview__primary-currency"]');
    this.sendButton = page.locator('[data-testid="eth-overview-send"]');
    this.receiveButton = page.locator('[data-testid="eth-overview-receive"]');
    this.swapButton = page.locator('[data-testid="token-overview-button-swap"]');
    this.bridgeButton = page.locator('[data-testid="eth-overview-bridge"]');
    this.accountName = page.locator('[data-testid="account-menu-icon"]');
    this.networkSelector = page.locator('[data-testid="network-display"]');
  }

  async waitForLoad() {
    await this.assetTab.waitFor({ state: 'visible', timeout: 30000 });
  }

  async getBalance(): Promise<string> {
    await this.balance.waitFor({ state: 'visible' });
    return await this.balance.textContent() || '0';
  }

  async assertBalanceDisplayed() {
    await expect(this.balance).toBeVisible();
  }

  async assertBalanceEquals(expectedBalance: string) {
    const balance = await this.getBalance();
    expect(balance).toContain(expectedBalance);
  }

  async clickSend() {
    await this.sendButton.click();
  }

  async clickReceive() {
    await this.receiveButton.click();
  }

  async clickSwap() {
    await this.swapButton.click();
  }

  async clickBridge() {
    await this.bridgeButton.click();
  }

  async switchToActivityTab() {
    await this.activityTab.click();
  }

  async switchToAssetTab() {
    await this.assetTab.click();
  }

  async getAccountName(): Promise<string> {
    return await this.accountName.textContent() || '';
  }

  async getNetworkName(): Promise<string> {
    return await this.networkSelector.textContent() || '';
  }

  async switchNetwork(networkName: string) {
    await this.networkSelector.click();
    await this.page.click(`text=${networkName}`);
    await this.page.waitForSelector('[data-testid="network-display"]');
  }

  async openAccountMenu() {
    await this.accountMenu.click();
  }

  async createNewAccount(accountName: string) {
    await this.openAccountMenu();
    await this.page.click('text=Create account');
    await this.page.fill('[data-testid="account-name-input"]', accountName);
    await this.page.click('button:has-text("Create")');
  }

  async importAccount(privateKey: string, accountName: string) {
    await this.openAccountMenu();
    await this.page.click('text=Import account');
    await this.page.selectOption('[data-testid="import-account-type-select"]', 'privateKey');
    await this.page.fill('[data-testid="private-key-box"]', privateKey);
    await this.page.fill('[data-testid="account-name-input"]', accountName);
    await this.page.click('button:has-text("Import")');
  }

  async assertWelcomeMessage() {
    const welcomeMessage = this.page.locator('text=/Welcome to MetaMask/i');
    await expect(welcomeMessage).toBeVisible();
  }

  async assertAccountOverviewVisible() {
    await expect(this.assetTab).toBeVisible();
    await expect(this.balance).toBeVisible();
  }
}
