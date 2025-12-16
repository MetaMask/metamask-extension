import { Driver } from '../../../webdriver/driver';

class SendPage {
  private driver: Driver;

  private readonly tokenAsset = (chainId: string, symbol: string) =>
    `[data-testid="token-asset-${chainId}-${symbol}"]`;

  private readonly inputRecipient =
    'input[placeholder="Enter or paste an address or name"]';

  private readonly recipientModalButton =
    '[data-testid="open-recipient-modal-btn"]';

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

  async selectAccountFromRecipientModal(accountName: string): Promise<void> {
    await this.driver.clickElement(this.recipientModalButton);
    await this.driver.clickElement({ text: accountName });
  }

  async createSendRequest({
    chainId,
    symbol,
    recipientAddress,
    amount,
  }: {
    chainId: string;
    symbol: string;
    recipientAddress: string;
    amount: string;
  }): Promise<void> {
    await this.selectToken(chainId, symbol);
    await this.fillRecipient(recipientAddress);
    await this.fillAmount(amount);
    await this.pressContinueButton();
  }

  async createMaxSendRequest({
    chainId,
    symbol,
    recipientAddress,
  }: {
    chainId: string;
    symbol: string;
    recipientAddress: string;
  }): Promise<void> {
    await this.selectToken(chainId, symbol);
    await this.fillRecipient(recipientAddress);
    await this.pressMaxButton();
    await this.pressContinueButton();
  }
}

export default SendPage;
