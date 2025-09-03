import { Driver } from '../../../webdriver/driver';

class SendTokenConfirmPage {
  private driver: Driver;

  private readonly cancelButton = '[data-testid="cancel-footer-button"]';

  private readonly confirmButton = '[data-testid="confirm-footer-button"]';

  private readonly nftImage = '[data-testid="nft-default-image"]';

  private readonly recipientAddress = '[data-testid="recipient-address"]';

  private readonly senderAddress = '[data-testid="sender-address"]';

  private readonly editGasFeeIcon = '[data-testid="edit-gas-fee-icon"]';

  private readonly maxBaseFeeInput = '[data-testid="base-fee-input"]';

  private readonly maxPriorityFeeInput = '[data-testid="priority-fee-input"]';

  private readonly editGasFeeItem = (
    gasFeeType: 'low' | 'medium' | 'high' | 'custom' | 'dappSuggested',
  ) => `[data-testid="edit-gas-fee-item-${gasFeeType}"] > span:first-child`;

  private readonly editGasFeeSeconds = {
    text: 'sec',
    tag: 'span',
  };

  private readonly saveDefaultValuesCheckbox = 'input[type="checkbox"]';

  private readonly advancedGasFeeEdit = '[data-testid="advanced-gas-fee-edit"]';

  private readonly gasLimitInput = '[data-testid="gas-limit-input"]';

  private readonly saveButton = {
    text: 'Save',
    tag: 'button',
  };

  private readonly firstGasField = '[data-testid="first-gas-field"]';

  private readonly nativeCurrency = '[data-testid="native-currency"]';

  private readonly inlineGasFeeAlert = '[data-testid="inline-alert"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkNftTransfer(options: {
    sender: string;
    recipient: string;
    nftName: string;
  }): Promise<void> {
    console.log('Checking NFT transfer details');

    const { sender, recipient, nftName } = options;

    await this.driver.waitForSelector(this.nftImage, { timeout: 10000 });

    await this.driver.waitForSelector({
      css: 'h2',
      text: nftName,
    });

    await this.driver.waitForSelector({
      css: this.senderAddress,
      text: sender,
    });

    await this.driver.waitForSelector({
      css: this.recipientAddress,
      text: recipient,
    });

    console.log('NFT transfer details are displayed correctly');
  }

  async checkTokenTransfer(options: {
    sender: string;
    recipient: string;
    amount: string;
    tokenName: string;
  }): Promise<void> {
    console.log('Checking token transfer details');

    const { sender, recipient, amount, tokenName } = options;

    await this.driver.waitForSelector(
      {
        text: `${amount} ${tokenName}`,
        tag: 'h2',
      },
      { timeout: 10000 },
    );

    await this.driver.waitForSelector(
      {
        css: this.senderAddress,
        text: sender,
      },
      { timeout: 10000 },
    );

    await this.driver.waitForSelector(
      {
        css: this.recipientAddress,
        text: recipient,
      },
      { timeout: 10000 },
    );

    console.log('Token transfer details are correct');
  }

  async checkTokenAmountTransfer(options: {
    amount: string;
    tokenName: string;
  }): Promise<void> {
    console.log('Checking token amount transfer details');
    const { amount, tokenName } = options;

    await this.driver.waitForSelector(
      {
        text: `${amount} ${tokenName}`,
        tag: 'h2',
      },
      { timeout: 10000 },
    );
    console.log('Token amount transfer details are correct');
  }

  async clickEditGasFeeIcon(): Promise<void> {
    await this.driver.clickElement(this.editGasFeeIcon);
    await this.driver.waitForSelector(this.editGasFeeSeconds);
  }

  async selectGasFeeItem(
    gasFeeType: 'low' | 'medium' | 'high' | 'custom' | 'dappSuggested',
  ): Promise<void> {
    console.log(`Selecting gas fee item ${gasFeeType}`);
    await this.driver.clickElement(this.editGasFeeItem(gasFeeType));
  }

  async enterMaxBaseFee(maxBaseFee: string): Promise<void> {
    console.log(`Entering max base fee ${maxBaseFee}`);
    await this.driver.fill(this.maxBaseFeeInput, maxBaseFee);
  }

  async enterMaxPriorityFee(maxPriorityFee: string): Promise<void> {
    console.log(`Entering max priority fee ${maxPriorityFee}`);
    await this.driver.fill(this.maxPriorityFeeInput, maxPriorityFee);
  }

  async saveDefaultValues(): Promise<void> {
    console.log('Saving default values');
    await this.driver.clickElement(this.saveDefaultValuesCheckbox);
  }

  async enterGasLimit(gasLimit: string): Promise<void> {
    console.log(`Entering gas limit ${gasLimit}`);
    await this.driver.clickElement(this.advancedGasFeeEdit);
    await this.driver.fill(this.gasLimitInput, gasLimit);
  }

  async updateGasFee(gasFeeType: 'low' | 'medium' | 'high'): Promise<void> {
    console.log(`Updating gas fee to ${gasFeeType}`);
    await this.clickEditGasFeeIcon();
    await this.selectGasFeeItem(gasFeeType);
    console.log(`Gas fee updated to ${gasFeeType}`);
  }

  async checkGasFee(gasFeeType: string): Promise<void> {
    console.log(`Checking if gas fee is ${gasFeeType}`);
    await this.driver.waitForSelector({
      text: gasFeeType,
    });
    console.log(`Gas fee is ${gasFeeType}`);
  }

  async checkGasFeeAlert(): Promise<void> {
    console.log('Checking if gas fee alert is displayed');
    await this.driver.waitForSelector(this.inlineGasFeeAlert);
  }

  async checkFirstGasFee(amount: string): Promise<void> {
    console.log(`Checking if first gas fee is ${amount}`);
    await this.driver.waitForSelector({
      css: this.firstGasField,
      text: amount,
    });
  }

  async checkNativeCurrency(amount: string): Promise<void> {
    console.log(`Checking if native currency is ${amount}`);
    await this.driver.waitForSelector({
      css: this.nativeCurrency,
      text: amount,
    });
  }

  async checkNetworkSpeed(networkSpeed: string): Promise<void> {
    console.log(`Checking if network speed is ${networkSpeed}`);
    await this.driver.waitForSelector({
      text: networkSpeed,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking if Send Token Confirmation page is loaded');
    await this.driver.waitForSelector(this.recipientAddress, {
      timeout: 10000,
    });
    await this.driver.waitForSelector(this.senderAddress, { timeout: 10000 });
    console.log('Send Token Confirmation page is loaded');
  }

  async clickOnCancel(): Promise<void> {
    console.log('Clicking on Cancel button');
    await this.driver.clickElementAndWaitToDisappear(this.cancelButton);
    console.log('Cancel button clicked');
  }

  async clickOnConfirm(): Promise<void> {
    console.log('Clicking on Confirm button');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
    console.log('Confirm button clicked');
  }

  async clickMetaMaskDialogConfirm(): Promise<void> {
    console.log('Clicking on Confirm button');
    await this.driver.clickElement(this.confirmButton);
  }

  async clickOnSave(): Promise<void> {
    console.log('Clicking on Save button');
    await this.driver.clickElementAndWaitToDisappear(this.saveButton);
  }
}

export default SendTokenConfirmPage;
