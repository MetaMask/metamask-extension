import { Driver } from '../../../webdriver/driver';

class SendPage {
  private readonly driver: Driver;

  private readonly amountInput = 'input[placeholder="0"]';

  private readonly continueButton = {
    text: 'Continue',
    tag: 'button',
  };

  private readonly hexDataInput = '[data-testid="send-amount-input"]';

  private readonly inputRecipient =
    'input[placeholder="Enter or paste an address or name"]';

  private readonly insufficientFundsError = {
    text: 'Insufficient funds',
  };

  private readonly insufficientFundsErrorDetailed = {
    text: 'Insufficient funds',
  };

  private readonly invalidAddressError = {
    text: 'Invalid address',
  };

  private readonly maxButton = {
    text: 'Max',
    tag: 'button',
  };

  private readonly recipientModalButton =
    '[data-testid="open-recipient-modal-btn"]';

  private readonly solanaNetwork = {
    text: 'Solana',
  };

  private readonly tokenAsset = (chainId: string, symbol: string) =>
    `[data-testid="token-asset-${chainId}-${symbol}"]`;

  constructor(driver: Driver) {
    this.driver = driver;
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

  async checkSolanaNetworkIsPresent(): Promise<void> {
    console.log('Checking if Solana network is present');
    await this.driver.findElement(this.solanaNetwork);
  }

  async clickMaxButton(): Promise<void> {
    console.log('Clicking max button');
    await this.driver.clickElement(this.maxButton);
  }

  async createMaxSendRequest({
    chainId,
    symbol,
    recipientAddress,
    recipientName,
  }: {
    chainId: string;
    symbol: string;
    recipientAddress?: string;
    recipientName?: string;
  }): Promise<void> {
    console.log('Creating max send request');
    await this.selectToken(chainId, symbol);
    if (recipientAddress) {
      await this.fillRecipient(recipientAddress);
    }
    if (recipientName) {
      await this.selectAccountFromRecipientModal(recipientName);
    }
    await this.clickMaxButton();
    await this.pressContinueButton();
  }

  async createSendRequest({
    chainId,
    symbol,
    recipientAddress,
    recipientName,
    amount = '0',
  }: {
    chainId: string;
    symbol: string;
    recipientAddress?: string;
    recipientName?: string;
    amount: string;
  }): Promise<void> {
    console.log('Creating send request');
    await this.selectToken(chainId, symbol);
    if (recipientAddress) {
      await this.fillRecipient(recipientAddress);
    }
    if (recipientName) {
      await this.selectAccountFromRecipientModal(recipientName);
    }
    await this.fillAmount(amount);
    await this.pressContinueButton();
  }

  async fillAmount(amount: string): Promise<void> {
    console.log(`Filling amount with ${amount}`);
    await this.driver.waitForSelector(this.amountInput);
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

  async selectNft(nftName: string): Promise<void> {
    console.log(`Selecting nft ${nftName}`);
    await this.driver.waitForSelector({ text: nftName });
    await this.driver.clickElement({ text: nftName });
  }

  async checkWarningMessage(warningText: string): Promise<void> {
    console.log(`Checking if warning message "${warningText}" is displayed`);
    await this.driver.waitForSelector({
      text: warningText,
    });
    console.log('Warning message validation successful');
  }

  /**
   * Verifies that an ENS domain correctly resolves to the specified Ethereum address on the send token screen.
   *
   * @param ensDomain - The ENS domain name expected to resolve (e.g., "test.eth").
   * @param address - The Ethereum address to which the ENS domain is expected to resolve.
   * @returns A promise that resolves if the ENS domain successfully resolves to the specified address on send token screen.
   */
  async checkEnsAddressResolution(
    ensDomain: string,
    address: string,
  ): Promise<void> {
    console.log(
      `Check ENS domain resolution: '${ensDomain}' should resolve to address '${address}' on the send token screen.`,
    );
    // check if ens domain is resolved as expected address
    await this.driver.waitForSelector({
      text: ensDomain,
    });
    await this.driver.waitForSelector({
      text: address,
    });
  }
}

export default SendPage;
