import { Driver } from '../../../webdriver/driver';

/**
 * Multichain send flow: asset, recipient, amount, and continue.
 *
 * Screen: `#/send` / `#/send/:page?`.
 * Owns: recipient and amount inputs, network/token pickers, Max, validation
 * and fee errors, hex data, alert acknowledge, and continue-enabled checks.
 * Boundaries: the send form through Continue. Confirmation / review screens
 * (including Bitcoin snap review) belong to confirmation or
 * `BitcoinReviewTxPage`.
 * Related: `BitcoinReviewTxPage`, `flows/send-transaction.flow.ts`,
 * `flows/bitcoin-send.flow.ts`.
 *
 * @see ui/pages/confirmations/send/send.tsx
 * @see ui/pages/confirmations/send/send-inner.tsx
 * @see test/e2e/page-objects/flows/send-transaction.flow.ts
 */
class SendPage {
  private readonly amountBalance = { testId: 'send-amount-balance' };

  private readonly amountFiatValue = { testId: 'send-amount-fiat-value' };

  private readonly amountInput = { testId: 'send-amount-input' };

  private readonly amountRequiredError = {
    text: 'Required',
  };

  private readonly continueButton = { testId: 'send-continue-button' };

  private readonly continueButtonEnabled =
    '[data-testid="send-continue-button"]:not([disabled])';

  private readonly continueButtonError = (errorText: string) => ({
    css: '[data-testid="send-continue-button"]',
    text: errorText,
  });

  private readonly driver: Driver;

  private readonly header = {
    tag: 'h4',
    text: 'Send',
  };

  private readonly hexDataInput = '[placeholder="Enter hex data (optional)"]';

  private readonly inputRecipient = {
    testId: 'recipient-address-input',
  };

  private readonly insufficientBalanceToCoverFeesError = {
    text: 'Insufficient balance to cover fees',
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

  private readonly networkName = (networkName: string) => {
    return {
      testId: networkName,
    };
  };

  private readonly networkPicker = {
    testId: 'send-network-filter-toggle',
  };

  private readonly recipientClassRendered = '.break-all';

  private readonly recipientModalButton = {
    testId: 'open-recipient-modal-btn',
  };

  private readonly recipientValidationError = (errorText: string) => ({
    css: '.mm-help-text',
    text: errorText,
  });

  private readonly sendAlertAcknowledgeButton =
    '[data-testid="send-alert-modal-acknowledge-button"]';

  private readonly sendPage = {
    testId: 'parent-selector-send-page',
  };

  private readonly solanaNetwork = {
    text: 'Solana',
  };

  private readonly tokenAsset = (chainId: string, symbol: string) => {
    return {
      testId: `token-asset-${chainId}-${symbol}`,
    };
  };

  private readonly transactionError = {
    text: 'Transaction error. Exception thrown in contract code.',
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

  async checkAmountRequiredError(): Promise<void> {
    console.log('Checking for amount required error');
    await this.driver.waitForSelector(this.amountRequiredError);
  }

  /**
   * Waits until the "available" balance shown on the amount screen matches the
   * expected token amount.
   *
   * @param expectedAmount - The expected available balance amount.
   */
  async checkAvailableBalance(expectedAmount: string): Promise<void> {
    console.log(`Waiting for available balance to be ${expectedAmount}`);
    await this.driver.waitUntil(
      async () => {
        const element = await this.driver.findElement(this.amountBalance);
        const text = await element.getText();
        const numeric = parseFloat(text.replace(/[^0-9.]/gu, ''));
        return numeric === parseFloat(expectedAmount);
      },
      { interval: 100, timeout: 15000 },
    );
  }

  /**
   * Waits for the continue button to reach the expected enabled/disabled state.
   *
   * @param options - Wait options.
   * @param options.state - Expected button state (`enabled` or `disabled`).
   */
  async checkContinueButton({
    state,
  }: {
    state: 'enabled' | 'disabled';
  }): Promise<void> {
    console.log(`Waiting for continue button to be ${state}`);
    await this.driver.waitForSelector(this.continueButton, {
      state,
    });
  }

  async checkContinueButtonIsDisabled(): Promise<void> {
    console.log('Checking that Continue button is disabled');
    await this.checkContinueButton({ state: 'disabled' });
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

  async checkInsufficientBalanceToCoverFeesError(): Promise<void> {
    await this.driver.waitForSelector(this.insufficientBalanceToCoverFeesError);
  }

  async checkInsufficientFundsError(): Promise<void> {
    console.log('Checking for insufficient funds error');
    await this.driver.waitForSelector(this.insufficientFundsError);
  }

  async checkInsufficientFundsErrorDetailed(): Promise<void> {
    console.log('Checking for detailed insufficient funds error');
    await this.driver.waitForSelector(this.insufficientFundsErrorDetailed);
  }

  async checkInvalidAddressError(): Promise<void> {
    console.log('Checking for invalid address error');
    await this.driver.waitForSelector(this.invalidAddressError);
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
        this.sendPage,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for send page to be loaded', e);
      throw e;
    }
    console.log('Send page is loaded');
  }

  /**
   * Waits for a recipient address validation error to be displayed.
   * Recipient validation is debounced, so callers should expect this to
   * wait rather than assert instantly.
   *
   * @param errorText - The expected (potentially localized) error text.
   */
  async checkRecipientValidationError(errorText: string): Promise<void> {
    console.log(`Checking recipient validation error: ${errorText}`);
    await this.driver.waitForSelector(this.recipientValidationError(errorText));
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

  /**
   * Waits for a non-EVM submit validation error on the Continue button after
   * Continue is pressed with an invalid amount (Tron shows transactionError
   * copy on the button rather than inline "Required").
   */
  async checkTransactionError(): Promise<void> {
    console.log('Checking for transaction error');
    await this.driver.waitForSelector(
      this.continueButtonError(this.transactionError.text),
    );
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
    await this.waitForSendAmountBalance();
    await this.checkContinueButton({ state: 'enabled' });
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
    await this.checkAmountInputValue(amount);
    await this.waitForSendAmountBalance();
    await this.checkContinueButton({ state: 'enabled' });
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

  /**
   * Clicks Continue once the button is stably enabled, then acknowledges the
   * optional send-alert modal when present.
   */
  async pressContinueButton(): Promise<void> {
    console.log('Pressing continue button');
    await this.waitForContinueButtonStablyEnabled();
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
    const tokenAsset = this.tokenAsset(chainId, symbol);
    await this.driver.waitForSelector(tokenAsset);
    await this.driver.clickElement(tokenAsset);
  }

  /**
   * Waits until the Continue button is visible, enabled, and remains so long
   * enough to avoid clicking during enable/disable flicker from validation.
   */
  async waitForContinueButtonStablyEnabled(): Promise<void> {
    console.log('Waiting for continue button to be stably enabled');
    await this.driver.waitUntil(
      async () => {
        return await this.driver.isElementPresentAndVisible(
          this.continueButtonEnabled,
          1000,
        );
      },
      { timeout: 30000, interval: 500, stableFor: 2000 },
    );
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
