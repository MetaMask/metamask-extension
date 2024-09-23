import { Driver } from '../webdriver/driver';
import { Page } from './page';

export class SmartSwapPage extends Page {
  constructor(driver: Driver) {
    super(driver);
  }

  async clickTokenOverviewSwapButton(): Promise<void> {
    await this.driver.clickElement('[data-testid="token-overview-swap-button"]');
  }

  async clickTransactionSettingsButton(): Promise<void> {
    await this.driver.clickElement('[data-testid="transaction-settings-button"]');
  }

  async checkSmartSwapsToggleNotPresent(): Promise<void> {
    const smartSwapsToggle = await this.driver.findElements('[data-testid="smart-swaps-toggle"]');
    if (smartSwapsToggle.length > 0) {
      throw new Error('Smart Swaps toggle is present when it should not be');
    }
  }
}
