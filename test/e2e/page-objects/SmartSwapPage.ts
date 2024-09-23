import { Driver } from '../webdriver/driver';
import { Page } from './page';

export class SmartSwapPage extends Page {
  private readonly tokenOverviewSwapButtonSelector = '[data-testid="token-overview-swap-button"]';
  private readonly transactionSettingsButtonSelector = '[data-testid="transaction-settings-button"]';
  private readonly smartSwapsToggleSelector = '[data-testid="smart-swaps-toggle"]';

  constructor(driver: Driver) {
    super(driver);
  }

  private async getTokenOverviewSwapButton() {
    return await this.driver.findElement(this.tokenOverviewSwapButtonSelector);
  }

  private async getTransactionSettingsButton() {
    return await this.driver.findElement(this.transactionSettingsButtonSelector);
  }

  private async getSmartSwapsToggle() {
    return await this.driver.findElements(this.smartSwapsToggleSelector);
  }

  async clickTokenOverviewSwapButton(): Promise<void> {
    const button = await this.getTokenOverviewSwapButton();
    await button.click();
  }

  async clickTransactionSettingsButton(): Promise<void> {
    const button = await this.getTransactionSettingsButton();
    await button.click();
  }

  async checkSmartSwapsToggleNotPresent(): Promise<void> {
    const smartSwapsToggle = await this.getSmartSwapsToggle();
    if (smartSwapsToggle.length > 0) {
      throw new Error('Smart Swaps toggle is present when it should not be');
    }
  }
}
