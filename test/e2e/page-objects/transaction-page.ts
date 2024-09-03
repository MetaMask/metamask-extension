import { Driver } from '../webdriver/driver';
import { Page } from './page';

export class TransactionPage extends Page {
  protected driver: Driver;

  constructor(driver: Driver) {
    super(driver);
    this.driver = driver;
  }

  // Locators
  private sendButton = '[data-testid="eth-overview-send"]';

  private recipientListItem = '.multichain-account-list-item';

  private currencyInput = '[data-testid="currency-input"]';

  private continueButton = 'button:contains("Continue")';

  private confirmButton = 'button:contains("Confirm")';

  private editButton = '[data-testid="confirm-page-back-edit-button"]';

  private assetPickerSymbol = '.asset-picker__symbol';

  private nftTab = 'button:contains("NFTs")';

  private nftImage = '[data-testid="nft-default-image"]';

  private transactionAmount = '.currency-display-component__text';

  private transactionTitle = '.confirm-page-container-summary__title';

  private transactionSubtitle = 'h3';

  private transactionStatus = 'p';

  private editGasFeeIcon = '[data-testid="edit-gas-fee-icon"]';

  private activityTab = '[data-testid="account-overview__activity-tab"]';

  private completedTransactions =
    '.transaction-list__completed-transactions .activity-list-item';

  private transactionListItemPrimaryCurrency =
    '[data-testid="transaction-list-item-primary-currency"]';

  // Actions
  async clickSendButton(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  async selectRecipient(): Promise<void> {
    await this.driver.clickElement(this.recipientListItem);
  }

  async enterAmount(amount: string): Promise<void> {
    await this.driver.clickElement(this.currencyInput);
    await this.driver.press(this.currencyInput, amount);
  }

  async clickContinue(): Promise<void> {
    await this.driver.clickElement(this.continueButton);
  }

  async clickConfirm(): Promise<void> {
    await this.driver.clickElement(this.confirmButton);
  }

  async clickEdit(): Promise<void> {
    await this.driver.clickElement(this.editButton);
  }

  async openAssetPicker(): Promise<void> {
    await this.driver.clickElement(this.assetPickerSymbol);
  }

  async selectNFTTab(): Promise<void> {
    await this.driver.clickElement(this.nftTab);
  }

  async selectNFT(): Promise<void> {
    await this.driver.clickElement(this.nftImage);
  }

  async clickEditGasFee(): Promise<void> {
    await this.driver.clickElement(this.editGasFeeIcon);
  }

  async clickActivityTab(): Promise<void> {
    await this.driver.clickElement(this.activityTab);
  }

  // Checks
  async check_transactionAmount(expectedAmount: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.transactionAmount,
      text: expectedAmount,
    });
    console.log(`Transaction amount is displayed as ${expectedAmount}`);
  }

  async check_nftSelected(symbol: string, id: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.assetPickerSymbol,
      text: symbol,
    });
    await this.driver.waitForSelector({ css: 'p', text: id });
    console.log(`NFT ${symbol} #${id} is selected`);
  }

  async check_nftDisplayed(name: string): Promise<void> {
    await this.driver.waitForSelector(`${this.transactionTitle} img`);
    await this.driver.waitForSelector({
      css: this.transactionSubtitle,
      text: name,
    });
    console.log(`NFT ${name} is displayed in the transaction summary`);
  }

  async check_transactionStatus(status: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.transactionStatus,
      text: status,
    });
    console.log(`Transaction status is displayed as: ${status}`);
  }

  async check_completedTransactionsCount(expectedCount: number): Promise<void> {
    await this.driver.wait(async () => {
      const confirmedTxes = await this.driver.findElements(
        this.completedTransactions,
      );
      return confirmedTxes.length === expectedCount;
    }, 10000);
    console.log(`Completed transactions count: ${expectedCount}`);
  }

  async check_transactionValue(expectedValue: string): Promise<void> {
    const txValues = await this.driver.findElements(
      this.transactionListItemPrimaryCurrency,
    );
    const txValue = await txValues[0].getText();
    console.log(`Transaction value: ${txValue}`);
    if (!new RegExp(expectedValue, 'u').test(txValue)) {
      throw new Error(
        `Expected transaction value ${expectedValue} does not match actual value ${txValue}`,
      );
    }
  }
}

export class GasFeePage extends Page {
  protected driver: Driver;

  constructor(driver: Driver) {
    super(driver);
    this.driver = driver;
  }

  // Locators
  private editGasFeeIcon = '[data-testid="edit-gas-fee-icon"]';

  private editGasFeeItemHigh =
    '[data-testid="edit-gas-fee-item-high"] > span:first-child';

  private editGasFeeItemMedium =
    '[data-testid="edit-gas-fee-item-medium"] > span:first-child';

  private editGasFeeItemLow =
    '[data-testid="edit-gas-fee-item-low"] > span:first-child';

  private editGasFeeItemCustom = '[data-testid="edit-gas-fee-item-custom"]';

  private baseFeeInput = '[data-testid="base-fee-input"]';

  private priorityFeeInput = '[data-testid="priority-fee-input"]';

  private gasLimitInput = '[data-testid="gas-limit-input"]';

  private saveDefaultCheckbox = 'input[type="checkbox"]';

  private advancedGasFeeEdit = '[data-testid="advanced-gas-fee-edit"]';

  private saveButton = 'button:contains("Save")';

  // Actions
  async clickEditGasFee(): Promise<void> {
    await this.driver.clickElement(this.editGasFeeIcon);
  }

  async selectHighGasFee(): Promise<void> {
    await this.driver.clickElement(this.editGasFeeItemHigh);
  }

  async selectMediumGasFee(): Promise<void> {
    await this.driver.clickElement(this.editGasFeeItemMedium);
  }

  async selectLowGasFee(): Promise<void> {
    await this.driver.clickElement(this.editGasFeeItemLow);
  }

  async selectCustomGasFee(): Promise<void> {
    await this.driver.clickElement(this.editGasFeeItemCustom);
  }

  async enterBaseFee(fee: string): Promise<void> {
    await this.driver.fill(this.baseFeeInput, fee);
  }

  async enterPriorityFee(fee: string): Promise<void> {
    await this.driver.fill(this.priorityFeeInput, fee);
  }

  async enterGasLimit(limit: string): Promise<void> {
    await this.driver.fill(this.gasLimitInput, limit);
  }

  async toggleSaveAsDefault(): Promise<void> {
    await this.driver.clickElement(this.saveDefaultCheckbox);
  }

  async clickAdvancedGasFeeEdit(): Promise<void> {
    await this.driver.clickElement(this.advancedGasFeeEdit);
  }

  async clickSave(): Promise<void> {
    await this.driver.clickElement(this.saveButton);
  }

  // Checks
  async check_gasFeeEstimate(estimate: string): Promise<void> {
    await this.driver.waitForSelector({
      text: estimate,
    });
    console.log(`Gas fee estimate is displayed as: ${estimate}`);
  }

  async check_lowGasFeeAlert(): Promise<void> {
    await this.driver.waitForSelector('[data-testid="low-gas-fee-alert"]');
    console.log('Low gas fee alert is displayed');
  }
}
