import { strict as assert } from 'assert';
import { WebElement } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class SendTokenPage {
  private driver: Driver;

  private readonly accountPickerButton =
    '[data-testid="send-page-account-picker"]';

  private readonly assetPickerButton = '[data-testid="asset-picker-button"]';

  private readonly multichainAssetPickerNetwork =
    '[data-testid="multichain-asset-picker__network"]';

  private readonly backButton =
    '[data-testid="wallet-initiated-header-back-button"]';

  private readonly contactsButton = { css: 'button', text: 'Contacts' };

  private readonly contactListItem = '[data-testid="address-list-item-label"]';

  private readonly continueButton = {
    text: 'Continue',
    tag: 'button',
  };

  private readonly confirmButton = {
    text: 'Confirm',
    tag: 'button',
  };

  private readonly cancelButton = {
    text: 'Cancel',
    tag: 'button',
  };

  private readonly ensAddressAsRecipient = '[data-testid="ens-input-selected"]';

  private readonly ensResolvedName =
    '[data-testid="multichain-send-page__recipient__item__title"]';

  private readonly hexInput = '[data-testid="send-hex-textarea"]';

  private readonly assetValue = '[data-testid="account-value-and-suffix"]';

  private readonly assetPickerSymbol =
    '[data-testid="asset-picker-button"] .asset-picker__symbol';

  private readonly inputAmount = '[data-testid="currency-input"]';

  private readonly inputNFTAmount = '[data-testid="nft-input"]';

  private readonly inputRecipient = '[data-testid="ens-input"]';

  private readonly nftTab = { css: 'button', text: 'NFTs' };

  private readonly nftListItem = '[data-testid="nft-wrapper"]';

  private readonly recipientAccount =
    '.multichain-account-list-item__account-name__button';

  private readonly scanButton = '[data-testid="ens-qr-scan-button"]';

  private readonly tokenListButton =
    '[data-testid="multichain-token-list-button"]';

  private readonly toastText = '.toast-text';

  private readonly tokenTab = { css: 'button', text: 'Tokens' };

  private readonly warning =
    '[data-testid="send-warning"] .mm-box--min-width-0 span';

  private readonly maxAmountButton = '[data-testid="max-clear-button"]';

  private readonly gasFeeField = '[data-testid="first-gas-field"]';

  private readonly fiatFeeField = '[data-testid="native-currency"]';

  private readonly sendFlowBackButton = '[aria-label="Back"]';

  private readonly tokenGasFeeDropdown =
    '[data-testid="selected-gas-fee-token-arrow"]';

  private readonly tokenGasFeeSymbol =
    '[data-testid="gas-fee-token-list-item-symbol"]';

  private readonly viewActivityButton =
    '[data-testid="smart-transaction-status-page-footer-close-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async getAssetPickerItems(): Promise<WebElement[]> {
    console.log('Retrieving asset picker items');
    return this.driver.findElements(this.tokenListButton);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.scanButton,
        this.inputRecipient,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for send token screen to be loaded',
        e,
      );
      throw e;
    }
    console.log('Send token screen is loaded');
  }

  async clickAssetPickerButton() {
    await this.driver.clickElement(this.assetPickerButton);
  }

  async clickMultichainAssetPickerNetwork() {
    await this.driver.clickElement(this.multichainAssetPickerNetwork);
  }

  async clickSendFlowBackButton() {
    await this.driver.clickElement(this.sendFlowBackButton);
    await this.driver.delay(2000); // Delay to ensure that the send page has cleared up
  }

  async clickFirstTokenListButton() {
    const elements = await this.driver.findElements(this.tokenListButton);
    await elements[0].click();
  }

  async clickAccountPickerButton() {
    console.log('Clicking on account picker button on send token screen');
    await this.driver.clickElement(this.accountPickerButton);
  }

  async clickSecondTokenListButton() {
    const elements = await this.driver.findElements(this.tokenListButton);
    await elements[1].click();
  }

  async clickOnAssetPicker(
    driver: Driver,
    location: 'src' | 'dest' = 'src',
  ): Promise<void> {
    console.log('Clicking on asset picker button');
    const isDest = location === 'dest';
    const buttons = await driver.findElements(this.assetPickerButton);
    const indexOfButtonToClick = isDest ? 1 : 0;
    await buttons[indexOfButtonToClick].click();
  }

  async checkAccountValueAndSuffix(value: string): Promise<void> {
    console.log(`Checking if account value and suffix is ${value}`);
    const element = await this.driver.waitForSelector(this.assetValue);
    const text = await element.getText();
    assert.equal(
      text,
      value,
      `Expected account value and suffix to be ${value}, got ${text}`,
    );
    console.log(`Account value and suffix is ${value}`);
  }

  async clickCancelButton(): Promise<void> {
    await this.driver.clickElement(this.cancelButton);
  }

  async clickContinueButton(): Promise<void> {
    console.log('Clicking on Continue button on send token screen');
    await this.driver.clickElement(this.continueButton, 3);
    console.log('Continue button clicked successfully');
  }

  async clickConfirmButton(): Promise<void> {
    await this.driver.clickElement(this.confirmButton);
  }

  async clickViewActivity(): Promise<void> {
    await this.driver.clickElement(this.viewActivityButton);
  }

  async fillAmount(amount: string): Promise<void> {
    console.log(`Fill amount input with ${amount} on send token screen`);
    const inputAmount = await this.driver.waitForSelector(this.inputAmount);
    await this.driver.pasteIntoField(this.inputAmount, amount);
    // The return value is not ts-compatible, requiring a temporary any cast to access the element's value. This will be corrected with the driver function's ts migration.

    const inputValue = await inputAmount.getAttribute('value');
    assert.equal(
      inputValue,
      amount,
      `Error when filling amount field on send token screen: the value entered is ${inputValue} instead of expected ${amount}.`,
    );
  }

  async selectTokenFee(tokenSymbol: string): Promise<void> {
    console.log(`Select token ${tokenSymbol} to pay for the fees`);
    await this.driver.clickElement(this.tokenGasFeeDropdown);
    await this.driver.clickElement({
      css: this.tokenGasFeeSymbol,
      text: tokenSymbol,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_networkChange(networkName: string): Promise<void> {
    const toastTextElement = await this.driver.findElement(this.toastText);
    const toastText = await toastTextElement.getText();
    assert.equal(
      toastText,
      `You're now using ${networkName}`,
      'Toast text is correct',
    );
  }

  async chooseNFTToSend(index = 0, timeout = 10000): Promise<void> {
    console.log(`Choosing NFT to send at index ${index}`);
    const nfts = await this.driver.findElements(this.nftListItem);
    if (nfts.length === 0) {
      throw new Error('No NFTs found to select');
    }

    const element = nfts[index];
    await element.click();
    // @ts-expect-error - The waitForElementState method is not typed correctly in the driver.
    await element.waitForElementState('hidden', timeout);
    console.log(`NFT at index ${index} selected successfully`);
  }

  async chooseTokenToSend(tokenName: string): Promise<void> {
    console.log(`Choosing token to send: ${tokenName}`);
    await this.driver.clickElement(
      {
        text: tokenName,
        css: `${this.tokenListButton} p`,
      },
      3,
    );
    console.log(`Token ${tokenName} selected successfully`);
  }

  async fillNFTAmount(amount: string) {
    await this.driver.pasteIntoField(this.inputNFTAmount, amount);
  }

  /**
   * Fill recipient address input on send token screen.
   *
   * @param recipientAddress - The recipient address to fill in the input field.
   */
  async fillRecipient(recipientAddress: string): Promise<void> {
    console.log(
      `Fill recipient input with ${recipientAddress} on send token screen`,
    );
    await this.driver.pasteIntoField(this.inputRecipient, recipientAddress);
  }

  async fillHexInput(hex: string): Promise<void> {
    console.log(`Filling hex input with: ${hex}`);
    await this.driver.pasteIntoField(this.hexInput, hex);
  }

  async getHexInputValue(): Promise<string> {
    console.log('Getting value from hex input');
    const hexInputElement = await this.driver.waitForSelector(this.hexInput);
    this.driver.waitForNonEmptyElement(hexInputElement);
    const value = await hexInputElement.getAttribute('value');
    console.log(`Hex input value: ${value}`);
    return value;
  }

  async clickMaxAmountButton(): Promise<void> {
    await this.driver.clickElement(this.maxAmountButton);
  }

  async chooseAssetTypeToSend(assetType: 'token' | 'nft'): Promise<void> {
    console.log(`Choosing asset type to send: ${assetType}`);
    if (assetType === 'nft') {
      await this.driver.clickElement(this.nftTab);
    } else {
      await this.driver.clickElement(this.tokenTab);
    }
  }

  async goToNextScreen(): Promise<void> {
    await this.driver.clickElement(this.continueButton);
  }

  async goToPreviousScreen(): Promise<void> {
    await this.driver.clickElement(this.backButton);
  }

  async validateSendFees(): Promise<void> {
    // Wait for both fields to be present and have the expected values
    await this.driver.waitForSelector({
      css: this.gasFeeField,
      text: '0.0004',
    });
    await this.driver.waitForSelector({
      css: this.fiatFeeField,
      text: '$0.75',
    });
    console.log('Send fees validation successful');
  }

  /**
   * Select a contact item on the send token screen.
   *
   * @param contactName - The name of the contact to select.
   */
  async selectContactItem(contactName: string): Promise<void> {
    console.log(`Selecting contact item: ${contactName} on send token screen`);
    await this.driver.clickElement(this.contactsButton);
    await this.driver.clickElement({
      text: contactName,
      css: this.contactListItem,
    });
  }

  /**
   * Select recipient account on send token screen.
   *
   * @param recipientAccount - The recipient account to select.
   */
  async selectRecipientAccount(recipientAccount: string): Promise<void> {
    await this.driver.clickElement({
      text: recipientAccount,
      css: this.recipientAccount,
    });
  }

  /**
   * Verifies that an address resolved via ENS can be selected as the recipient on the send token screen.
   *
   * @param ensDomain - The ENS domain name expected to resolve to the given address.
   * @param address - The Ethereum address to which the ENS domain is expected to resolve.
   * @returns A promise that resolves if the ENS domain can be successfully used as a recipient address on the send token screen.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_ensAddressAsRecipient(
    ensDomain: string,
    address: string,
  ): Promise<void> {
    // click to select the resolved adress
    await this.driver.clickElement({
      text: ensDomain,
      css: this.ensResolvedName,
    });
    // user should be able to send token to the resolved address
    await this.driver.waitForSelector({
      css: this.ensAddressAsRecipient,
      text: ensDomain + address,
    });
    console.log(
      `ENS domain '${ensDomain}' resolved to address '${address}' and can be used as recipient on send token screen.`,
    );
  }

  /**
   * Verifies that an ENS domain correctly resolves to the specified Ethereum address on the send token screen.
   *
   * @param ensDomain - The ENS domain name expected to resolve (e.g., "test.eth").
   * @param address - The Ethereum address to which the ENS domain is expected to resolve.
   * @returns A promise that resolves if the ENS domain successfully resolves to the specified address on send token screen.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_ensAddressResolution(
    ensDomain: string,
    address: string,
  ): Promise<void> {
    console.log(
      `Check ENS domain resolution: '${ensDomain}' should resolve to address '${address}' on the send token screen.`,
    );
    // check if ens domain is resolved as expected address
    await this.driver.waitForSelector({
      text: ensDomain,
      css: this.ensResolvedName,
    });
    await this.driver.waitForSelector({
      text: address,
    });
  }

  /**
   * Verifies that a specific warning message is displayed on the send token screen.
   *
   * @param warningText - The expected warning text to validate against.
   * @returns A promise that resolves if the warning message matches the expected text.
   * @throws Assertion error if the warning message does not match the expected text.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_warningMessage(warningText: string): Promise<void> {
    console.log(`Checking if warning message "${warningText}" is displayed`);
    await this.driver.waitForSelector({
      css: this.warning,
      text: warningText,
    });
    console.log('Warning message validation successful');
  }

  /**
   * Checks if the specified token symbol is displayed in the asset picker.
   * Optionally verifies that the token ID is also displayed.
   *
   * @param tokenSymbol - The symbol of the token to check for (e.g., "ETH", "DAI").
   * @param tokenId - (Optional) The token ID to verify is displayed alongside the symbol. (e.g., "1", "2345")
   * @returns A promise that resolves when the check is complete.
   * @throws AssertionError if the displayed token symbol does not match the expected value.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_tokenSymbolInAssetPicker(
    tokenSymbol: string,
    tokenId?: string,
  ): Promise<void> {
    console.log(`Checking if token symbol "${tokenSymbol}" is displayed`);
    const assetPickerSymbol = await this.driver.waitForSelector(
      this.assetPickerSymbol,
    );
    this.driver.waitForNonEmptyElement(assetPickerSymbol);
    const text = await assetPickerSymbol.getText();
    assert.equal(
      text,
      tokenSymbol,
      `Expected token symbol to be ${tokenSymbol}, got ${text}`,
    );

    if (tokenId) {
      const id = `#${tokenId}`;
      await this.driver.waitForSelector({ css: 'p', text: id });
      console.log(
        `Token ID "${id}" is displayed successfully for ${tokenSymbol}`,
      );
    }

    console.log(`Token symbol "${tokenSymbol}" is displayed successfully`);
  }
}

export default SendTokenPage;
