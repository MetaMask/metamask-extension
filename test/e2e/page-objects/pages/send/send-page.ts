import { Driver } from '../../../webdriver/driver';

class SendPage {
  private readonly driver: Driver;

  private readonly amountInput = 'input[placeholder="0"]';

  private readonly cancelButton = {
    text: 'Cancel',
    tag: 'button',
  };

  private readonly continueButton = {
    text: 'Continue',
    tag: 'button',
  };

  private readonly hexDataInput = '[data-testid="send-hex-textarea"]';

  // Note: Different send flows use different placeholders:
  // - Legacy flow: "Enter public address (0x) or domain name"
  // - New confirmations flow: "Enter or paste an address or name"
  // - Fallback: data-testid="ens-input"
  private readonly inputRecipient =
    'input[placeholder="Enter public address (0x) or domain name"], input[placeholder="Enter or paste an address or name"], [data-testid="ens-input"]';

  private readonly insufficientFundsError = {
    text: 'Insufficient funds',
  };

  private readonly insufficientFundsErrorDetailed = {
    css: '[data-testid="send-page-amount-error"]',
    text: '. Insufficient funds.',
  };

  private readonly invalidAddressError = {
    text: 'Invalid address',
  };

  // Max button has data-testid in multichain flow, but only text in send redesign flow
  private readonly maxClearButton = {
    text: 'Max',
    tag: 'button',
  };

  private readonly qrScanButton = '[data-testid="ens-qr-scan-button"]';

  private readonly qrScannerCameraError = {
    css: '.qr-scanner__error',
    text: "We couldn't access your camera. Please give it another try.",
  };

  private readonly qrScannerModal = '[data-testid="qr-scanner-modal"]';

  private readonly recipientModalButton =
    '[data-testid="open-recipient-modal-btn"]';

  private readonly solanaNetwork = {
    text: 'Solana',
  };

  private readonly tokenAsset = (chainId: string, symbol: string) =>
    `[data-testid="token-asset-${chainId}-${symbol}"]`;

  private readonly networkFilterToggle =
    '[data-testid="send-network-filter-toggle"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkNetworkFilterToggleIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.networkFilterToggle);
  }

  async cancelQrScannerModal(): Promise<void> {
    console.log('Cancelling QR scanner modal');
    await this.driver.clickElementAndWaitToDisappear(this.cancelButton);
  }

  async checkInsufficientFundsError(): Promise<void> {
    console.log('Checking for insufficient funds error');
    await this.driver.findElement(this.insufficientFundsError);
  }

  async checkInsufficientFundsErrorDetailed(): Promise<void> {
    console.log('Checking for detailed insufficient funds error');
    await this.driver.waitForSelector(this.insufficientFundsErrorDetailed);
  }

  async checkInvalidAddressError(): Promise<void> {
    console.log('Checking for invalid address error');
    await this.driver.findElement(this.invalidAddressError);
  }

  async checkQrScannerCameraError(): Promise<void> {
    console.log('Checking for QR scanner camera error');
    await this.driver.waitForSelector(this.qrScannerCameraError);
  }

  async checkQrScannerModalIsClosed(): Promise<void> {
    console.log('Checking QR scanner modal is closed');
    await this.driver.assertElementNotPresent(this.qrScannerModal);
  }

  async checkQrScannerModalIsOpen(): Promise<void> {
    console.log('Checking QR scanner modal is open');
    await this.driver.findVisibleElement(this.qrScannerModal);
  }

  async checkSolanaNetworkIsPresent(): Promise<void> {
    console.log('Checking if Solana network is present');
    await this.driver.findElement(this.solanaNetwork);
  }

  async clickMaxClearButton(): Promise<void> {
    console.log('Clicking max/clear button');
    // Different flows have different max button implementations:
    // - Multichain flow: data-testid="max-clear-button" (toggles Max/Clear)
    // - Send redesign flow: text-based "Max" button
    const dataTestIdSelector = '[data-testid="max-clear-button"]';

    // Quick check (1s) to determine which flow we're in
    const hasDataTestId = await this.driver.isElementPresentAndVisible(
      dataTestIdSelector,
      1000,
    );

    if (hasDataTestId) {
      await this.driver.clickElement(dataTestIdSelector);
    } else {
      await this.driver.clickElement(this.maxClearButton);
    }
  }

  async clickQrScanButton(): Promise<void> {
    console.log('Clicking QR scan button');
    await this.driver.clickElement(this.qrScanButton);
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
    console.log('Creating max send request');
    await this.selectToken(chainId, symbol);
    await this.fillRecipient(recipientAddress);
    await this.clickMaxClearButton();
    await this.pressContinueButton();
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
    console.log('Creating send request');
    await this.selectToken(chainId, symbol);
    await this.fillRecipient(recipientAddress);
    await this.fillAmount(amount);
    await this.pressContinueButton();
  }

  async fillAmount(amount: string): Promise<void> {
    console.log(`Filling amount with ${amount}`);
    await this.driver.pasteIntoField(this.amountInput, amount);
  }

  async fillHexData(hexData: string): Promise<void> {
    console.log(`Filling hex data`);
    await this.driver.fill(this.hexDataInput, hexData);
  }

  async fillRecipient(recipientAddress: string): Promise<void> {
    console.log(`Filling recipient with ${recipientAddress}`);
    await this.driver.pasteIntoField(this.inputRecipient, recipientAddress);
  }

  async getAmountInputValue(): Promise<string> {
    console.log('Getting amount input value');
    const inputElement = await this.driver.findElement(this.amountInput);
    const value = await inputElement.getAttribute('value');
    console.log(`Amount input value: ${value}`);
    return value as string;
  }

  async isContinueButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.continueButton, {
        timeout: 2000,
      });
    } catch (e) {
      console.log('Continue button not enabled', e);
      return false;
    }
    console.log('Continue button enabled');
    return true;
  }

  async pressContinueButton(): Promise<void> {
    console.log('Pressing continue button');
    await this.driver.clickElement(this.continueButton);
  }

  async pressOnAmountInput(key: string): Promise<void> {
    console.log(`Pressing ${key} on amount input`);
    await this.driver.press(
      this.amountInput,
      this.driver.Key[key as keyof typeof this.driver.Key],
    );
  }

  async selectAccountFromRecipientModal(accountName: string): Promise<void> {
    console.log(`Selecting account ${accountName} from recipient modal`);
    await this.driver.clickElement(this.recipientModalButton);
    await this.driver.clickElement({ text: accountName });
  }

  async selectToken(chainId: string, symbol: string): Promise<void> {
    console.log(`Selecting token ${symbol} on chain ${chainId}`);
    await this.driver.clickElement(this.tokenAsset(chainId, symbol));
  }

  async typeAmount(amount: string): Promise<void> {
    console.log(`Typing amount: ${amount}`);
    const inputElement = await this.driver.findElement(this.amountInput);
    for (const char of amount) {
      await inputElement.sendKeys(char);
    }
  }

  async checkSendFormIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.amountInput,
      this.inputRecipient,
    ]);
  }
}

export default SendPage;
