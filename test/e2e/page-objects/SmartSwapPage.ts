import { Driver } from '../webdriver/driver';

export class SmartSwapPage {
  private driver: Driver;

  private tokenOverviewSwapButton: string;
  private transactionSettingsButton: string;
  private smartSwapsToggle: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.tokenOverviewSwapButton = '[data-testid="token-overview-swap-button"]';
    this.transactionSettingsButton = '[data-testid="transaction-settings-button"]';
    this.smartSwapsToggle = '[data-testid="smart-swaps-toggle"]';
  }

  async clickTokenOverviewSwapButton(): Promise<void> {
    await this.driver.clickElement(this.tokenOverviewSwapButton);
  }

  async clickTransactionSettingsButton(): Promise<void> {
    await this.driver.clickElement(this.transactionSettingsButton);
  }

  async checkSmartSwapsToggleNotPresent(): Promise<void> {
    const smartSwapsToggle = await this.driver.findElements(this.smartSwapsToggle);
    if (smartSwapsToggle.length > 0) {
      throw new Error('Smart Swaps toggle is present when it should not be');
    }
  }
}
