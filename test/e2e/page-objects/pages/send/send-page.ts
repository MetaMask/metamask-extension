import { Driver } from '../../../webdriver/driver';

class SendPage {
  private readonly driver: Driver;

  private readonly amountInput = { testId: 'send-amount-input' };

  private readonly amountBalance = { testId: 'send-amount-balance' };

  private readonly amountFiatValue = { testId: 'send-amount-fiat-value' };

  private readonly continueButton = { testId: 'send-continue-button' };

  private readonly sendAlertAcknowledgeButton =
    '[data-testid="send-alert-modal-acknowledge-button"]';

  private readonly header = {
    tag: 'h4',
    text: 'Send',
  };

  private readonly hexDataInput = '[placeholder="Enter hex data (optional)"]';

  private readonly inputRecipient = {
    testId: 'recipient-address-input',
  };

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

  private readonly networkPicker = {
    testId: 'send-network-filter-toggle',
  };

  private readonly recipientClassRendered = '.break-all';

  private readonly recipientModalButton = {
    testId: 'open-recipient-modal-btn',
  };

  private readonly solanaNetwork = {
    text: 'Solana',
  };

  private readonly tokenAsset = (chainId: string, symbol: string) => {
    return {
      testId: `token-asset-${chainId}-${symbol}`,
    };
  };

  private readonly networkName = (networkName: string) => {
    return {
      testId: networkName,
    };
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Acknowledges the first-time recipient send alert when it appears after Continue.
   * The alert is async; a short wait avoids racing React 18 mount on slower flows.
   */
  async acknowledgeSendAlertIfPresent(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.sendAlertAcknowledgeButton, {
        timeout: 2000,
      });
    } catch (error) {
      if ((error as { name?: string }).name === 'TimeoutError') {
        console.log('No send alert modal to acknowledge');
        return;
      }
      throw error;
    }
    console.log('Acknowledging send alert modal');
    await this.driver.clickElement(this.sendAlertAcknowledgeButton);
  }

  /**
   * Waits until the amount input value matches the expected amount (compared
   * numerically). Prefer this over reading the value once, which races the fill.
   *
   * @param expectedAmount - The expected amount.
   */
  async checkAmountInputValue(expectedAmount: string): Promise<void> {
    console.log(`Waiting for amount input value to be ${expectedAmount}`);
    await this.driver.waitUntil(
      async () => {
        const inputElement = await this.driver.findElement(this.amountInput);
        const value = await inputElement.getAttribute('value');
        return parseFloat(value) === parseFloat(expectedAmount);
      },
      { interval: 100, timeout: 5000 },
    );
  }

  async checkContinueButtonDisabled(): Promise<void> {
    console.log('Waiting for continue button to be disabled');
    await this.driver.waitForSelector(this.continueButton, {
      state: 'disabled',
    });
  }

  async checkContinueButtonEnabled(): Promise<void> {
    console.log('Waiting for continue button to be enabled');
    await this.driver.waitForSelector(this.continueButton, {
      state: 'enabled',
    });
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

  async checkNetworkFilterToggleIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.networkPicker);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking if send page is loaded');
    try {
      await this.driver.waitForMultipleSelectors([
        this.header,
        this.networkPicker,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for send page to be loaded', e);
      throw e;
    }
    console.log('Send page is loaded');
  }

  async checkSendFormIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.amountInput,
      this.inputRecipient,
    ]);
  }

  async checkSolanaNetworkIsPresent(): Promise<void> {
    console.log('Checking if Solana network is present');
    await this.driver.findElement(this.solanaNetwork);
  }

  async checkWarningMessage(warningText: string): Promise<void> {
    console.log(`Checking if warning message "${warningText}" is displayed`);
    await this.driver.waitForSelector({
      text: warningText,
    });
    console.log('Warning message validation successful');
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
      await this.fillRecipient({ recipientAddress });
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
      await this.fillRecipient({ recipientAddress });
    }
    if (recipientName) {
      await this.selectAccountFromRecipientModal(recipientName);
    }
    await this.fillAmount(amount);
    await this.pressContinueButton();
  }

  async editAmountByKeys(keys: string[]): Promise<void> {
    console.log('Editing amount value by key presses');
    for (const key of keys) {
      await this.driver.press(this.amountInput, key);
    }
  }

  async fillAmount(amount: string): Promise<void> {
    console.log(`Filling amount with ${amount}`);
    await this.driver.waitForSelector(this.amountInput);
    await this.driver.pasteIntoField(this.amountInput, amount);
  }

  async fillHexData(hexData: string): Promise<void> {
    console.log(`Filling hex data`);
    await this.driver.fill(this.hexDataInput, hexData);
    // Tab out of the hex data field to trigger onBlur and ensure React commits the value to state
    await this.driver.press(this.hexDataInput, '\uE004');
  }

  async fillRecipient({
    recipientAddress,
    validAddress = true,
  }: {
    recipientAddress: string;
    validAddress?: boolean;
  }): Promise<void> {
    console.log(`Filling recipient with ${recipientAddress}`);
    await this.driver.pasteIntoField(this.inputRecipient, recipientAddress);
    // After we add the recipient, a new re-render happens which formats the recipient element.
    // We wait for that to happen before proceeding with the next step to prevent flakiness.
    // When the address is invalid the formatted element never renders, so we skip the wait.
    if (validAddress) {
      await this.driver.waitForSelector(this.recipientClassRendered);
    }
  }

  async pressContinueButton(): Promise<void> {
    console.log('Pressing continue button');
    await this.driver.clickElement(this.continueButton);
    await this.acknowledgeSendAlertIfPresent();
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

  async selectNetworkByName(networkName: string): Promise<void> {
    console.log(`Selecting network ${networkName}`);
    await this.driver.clickElement(this.networkPicker);
    await this.driver.clickElement(this.networkName(networkName));
  }

  async selectNft(nftName: string): Promise<void> {
    console.log(`Selecting nft ${nftName}`);
    await this.driver.waitForElementToStopMoving({ text: nftName });
    await this.driver.clickElement({ text: nftName });
  }

  async selectToken(chainId: string, symbol: string): Promise<void> {
    console.log(`Selecting token ${symbol} on chain ${chainId}`);
    await this.driver.clickElement(this.tokenAsset(chainId, symbol));
  }

  async waitForSendAmountBalance(): Promise<void> {
    console.log('Waiting for send amount balance to be displayed');
    await this.driver.waitForSelector(this.amountBalance);
  }

  async waitForSendAmountFiatValue(expectedValue: string): Promise<void> {
    console.log(
      `Waiting for send amount fiat value "${expectedValue}" to be displayed`,
    );
    await this.driver.waitForSelector({
      ...this.amountFiatValue,
      text: expectedValue,
    });
  }
}

export default SendPage;
