import { Driver } from '../../../webdriver/driver';

class SendPage {
  private driver: Driver;

  private readonly tokenAsset = (chainId: string, symbol: string) =>
    `[data-testid="token-asset-${chainId}-${symbol}"]`;

  private readonly inputRecipient =
    'input[placeholder="Enter or paste a valid address"]';

  private readonly amountInput = 'input[placeholder="0"]';

  private readonly continueButton = {
    text: 'Continue',
    tag: 'button',
  };

  private readonly maxButton = {
    text: 'Max',
    tag: 'button',
  };

  private readonly insufficientFundsError = {
    text: 'Insufficient funds',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async selectToken(chainId: string, symbol: string): Promise<void> {
    await this.driver.clickElement(this.tokenAsset(chainId, symbol));
  }

  async fillRecipient(recipientAddress: string): Promise<void> {
    await this.driver.pasteIntoField(this.inputRecipient, recipientAddress);
  }

  async fillAmount(amount: string): Promise<void> {
    await this.driver.pasteIntoField(this.amountInput, amount);
  }

  async pressOnAmountInput(key: string): Promise<void> {
    await this.driver.press(
      'input[placeholder="0"]',
      this.driver.Key[key as keyof typeof this.driver.Key],
    );
  }

  async pressMaxButton(): Promise<void> {
    await this.driver.clickElement(this.maxButton);
  }

  async pressContinueButton(): Promise<void> {
    await this.driver.clickElement(this.continueButton);
  }

  async checkInsufficientFundsError(): Promise<void> {
    await this.driver.findElement(this.insufficientFundsError);
  }
}

export default SendPage;
