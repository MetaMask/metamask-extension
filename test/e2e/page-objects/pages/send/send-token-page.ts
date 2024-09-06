import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';
import { DEFAULT_GANACHE_ETH_BALANCE_DEC } from '../../../constants';

class SendTokenPage {
  private driver: Driver;

  private inputRecipient: string;

  private scanButton: string;

  private continueButton: object;

  private ensResolvedName: string;

  private ensAddressAsRecipient: string;

  private ensResolvedAddress: string;

  private assetPickerButton: string;

  private nftTabButton: string;

  private nftAssetSelector: string;

  private accountPickerButton: string;

  private selectedAssetSymbol: string;

  private tokensTabButton: string;

  private inputAmountSelector: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.inputRecipient = '[data-testid="ens-input"]';
    this.scanButton = '[data-testid="ens-qr-scan-button"]';
    this.ensResolvedName =
      '[data-testid="multichain-send-page__recipient__item__title"]';
    this.ensResolvedAddress =
      '[data-testid="multichain-send-page__recipient__item__subtitle"]';
    this.ensAddressAsRecipient = '[data-testid="ens-input-selected"]';
    this.continueButton = { text: 'Continue', tag: 'button' };
    this.assetPickerButton = '.asset-picker__symbol';
    this.nftTabButton = '[data-testid="nft-tab"]';
    this.nftAssetSelector = '[data-testid="nft-default-image"]';
    this.accountPickerButton = '[data-testid="send-page-account-picker"]';
    this.selectedAssetSymbol = '.asset-picker__symbol';
    this.tokensTabButton = '[data-testid="tokens-tab"]';
    this.inputAmountSelector = '[data-testid="currency-input"]';
  }

  /**
   * Checks if the send token page is loaded by waiting for specific elements to be present.
   *
   * @throws {Error} If the page fails to load within the timeout period.
   */
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.scanButton,
        this.inputRecipient,
      ]);
      console.log('Send token screen is loaded');
    } catch (e) {
      const errorMessage =
        'Timeout while waiting for send token screen to be loaded';
      console.error(errorMessage, e);
      throw new Error(errorMessage);
    }
  }

  /**
   * Fills the recipient input field with the provided address.
   *
   * @param recipientAddress - The address of the recipient.
   * @throws {Error} If the recipient address cannot be entered.
   */
  async fillRecipient(recipientAddress: string): Promise<void> {
    try {
      console.log(
        `Filling recipient input with ${recipientAddress} on send token screen`,
      );
      await this.driver.pasteIntoField(this.inputRecipient, recipientAddress);
      console.log(`Recipient address ${recipientAddress} successfully entered`);
    } catch (e) {
      const errorMessage = `Failed to enter recipient address ${recipientAddress}`;
      console.error(errorMessage, e);
      throw new Error(errorMessage);
    }
  }

  /**
   * Inputs the specified amount into the currency input field.
   *
   * @param amount - The amount to be entered.
   * @throws {Error} If the amount cannot be entered or verified.
   */
  public async inputAmount(amount: string): Promise<void> {
    console.log(`Starting inputAmount method with amount: ${amount}`);
    const inputAmountSelector = '[data-testid="currency-input"]';
    try {
      const inputAmount = await this.driver.waitForSelector(
        inputAmountSelector,
      );
      await this.driver.pasteIntoField(inputAmountSelector, amount);
      // The return value is not ts-compatible, requiring a temporary any cast to access the element's value. This will be corrected with the driver function's ts migration.
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inputValue = await (inputAmount as any).getProperty('value');
      assert.equal(
        inputValue,
        amount,
        `Error when filling amount field on send token screen: the value entered is ${inputValue} instead of expected ${amount}.`,
      );
      console.log(
        `Completed inputAmount method. Amount ${amount} successfully entered.`,
      );
    } catch (e) {
      const errorMessage = `Failed to enter or verify amount ${amount}`;
      console.error(errorMessage, e);
      throw new Error(errorMessage);
    }
  }

  /**
   * Clicks the continue button on the send token screen.
   *
   * @throws {Error} If the continue button is not clickable or not found.
   */
  async clickContinue(): Promise<void> {
    console.log('Clicking continue button on send token screen');
    try {
      await this.driver.clickElement(this.continueButton);
    } catch (error) {
      console.error('Failed to click continue button:', error);
      throw new Error('Unable to click continue button on send token screen');
    }
  }

  /**
   * Selects the first recipient from the list.
   *
   * @throws {Error} If no recipient is found or not clickable.
   */
  async selectRecipient(): Promise<void> {
    console.log('Selecting the first recipient from the list');
    try {
      await this.driver.clickElement('.multichain-account-list-item');
    } catch (error) {
      console.error('Failed to select recipient:', error);
      throw new Error('Unable to select recipient from the list');
    }
  }

  /**
   * Opens the asset picker.
   *
   * @throws {Error} If the asset picker button is not clickable or not found.
   */
  async openAssetPicker(): Promise<void> {
    console.log('Opening asset picker');
    try {
      await this.driver.clickElement(this.assetPickerButton);
    } catch (error) {
      console.error('Failed to open asset picker:', error);
      throw new Error('Unable to open asset picker');
    }
  }

  /**
   * Selects an NFT asset.
   *
   * @throws {Error} If unable to select the NFT asset.
   */
  async selectNFTAsset(): Promise<void> {
    console.log('Selecting NFT asset');
    try {
      await this.driver.clickElement(this.nftTabButton);
      await this.driver.clickElement(this.nftAssetSelector);
    } catch (error) {
      console.error('Failed to select NFT asset:', error);
      throw new Error('Unable to select NFT asset');
    }
  }

  /**
   * Validates the selected NFT.
   *
   * @param symbol - The symbol of the selected NFT.
   * @param id - The ID of the selected NFT.
   * @throws {Error} If the selected NFT does not match the expected symbol and ID.
   */
  async validateSelectedNFT(symbol: string, id: string): Promise<void> {
    console.log(`Validating selected NFT: ${symbol} #${id}`);
    try {
      await this.driver.waitForSelector({
        css: this.selectedAssetSymbol,
        text: symbol,
      });
      await this.driver.waitForSelector({ css: 'p', text: id });
      console.log(`Successfully validated NFT: ${symbol} #${id}`);
    } catch (error) {
      console.error(`Failed to validate selected NFT ${symbol} #${id}:`, error);
      throw new Error(`Selected NFT does not match expected: ${symbol} #${id}`);
    }
  }

  /**
   * Switches to the specified account in the send token flow.
   *
   * @param accountName - The name of the account to switch to.
   * @throws Will throw an error if the account switch fails.
   */
  async switchToAccount(accountName: string): Promise<void> {
    console.log(`Switching to account: ${accountName}`);
    try {
      await this.driver.clickElement(this.accountPickerButton);
      await this.driver.clickElement({
        css: '.multichain-account-list-item .multichain-account-list-item__account-name__button',
        text: accountName,
      });
      console.log(`Successfully switched to account: ${accountName}`);
    } catch (error) {
      console.error(`Failed to switch to account: ${accountName}`, error);
      throw new Error(`Failed to switch to account: ${accountName}`);
    }
  }

  /**
   * Validates that the specified asset is selected in the send token flow.
   *
   * @param assetSymbol - The symbol of the asset to validate.
   * @throws Will throw an error if the asset is not selected within the timeout period.
   */
  async validateSelectedAsset(assetSymbol: string): Promise<void> {
    console.log(`Validating selected asset: ${assetSymbol}`);
    try {
      await this.driver.waitForSelector({
        css: this.selectedAssetSymbol,
        text: assetSymbol,
      });
      console.log(`Asset ${assetSymbol} is successfully selected`);
    } catch (error) {
      console.error(`Failed to validate selected asset: ${assetSymbol}`, error);
      throw new Error(`Asset ${assetSymbol} is not selected or not visible`);
    }
  }

  /**
   * Checks if the ENS domain resolves to the expected address on the send token screen.
   *
   * @param ensDomain - The ENS domain to check.
   * @param address - The expected Ethereum address.
   * @throws Will throw an error if the ENS resolution fails or doesn't match the expected address.
   */
  async check_ensAddressResolution(
    ensDomain: string,
    address: string,
  ): Promise<void> {
    console.log(
      `Checking ENS domain resolution: '${ensDomain}' should resolve to address '${address}' on the send token screen.`,
    );
    try {
      await this.driver.waitForSelector({
        text: ensDomain,
        css: this.ensResolvedName,
      });
      await this.driver.waitForSelector({
        text: address,
        css: this.ensResolvedAddress,
      });
      console.log(
        `ENS domain '${ensDomain}' successfully resolved to address '${address}'`,
      );
    } catch (error) {
      console.error(`ENS resolution failed for domain '${ensDomain}'`, error);
      throw new Error(`ENS resolution failed for domain '${ensDomain}'`);
    }
  }

  /**
   * Checks if the ENS address can be used as a recipient on the send token screen.
   *
   * @param ensDomain - The ENS domain to use as recipient.
   * @param address - The Ethereum address associated with the ENS domain.
   * @throws Will throw an error if the ENS address cannot be used as a recipient.
   */
  async check_ensAddressAsRecipient(
    ensDomain: string,
    address: string,
  ): Promise<void> {
    console.log(
      `Checking if ENS domain '${ensDomain}' can be used as recipient`,
    );
    try {
      await this.driver.clickElement({
        text: ensDomain,
        css: this.ensResolvedName,
      });
      await this.driver.waitForSelector({
        css: this.ensAddressAsRecipient,
        text: ensDomain + address,
      });
      console.log(
        `ENS domain '${ensDomain}' resolved to address '${address}' and can be used as recipient on send token screen.`,
      );
    } catch (error) {
      console.error(
        `Failed to use ENS domain '${ensDomain}' as recipient`,
        error,
      );
      throw new Error(`Failed to use ENS domain '${ensDomain}' as recipient`);
    }
  }

  /**
   * Selects the Tokens tab in the asset picker.
   *
   * @throws Will throw an error if the Tokens tab cannot be selected.
   */
  async selectTokensTab(): Promise<void> {
    console.log('Selecting Tokens tab');
    try {
      await this.driver.clickElement(this.tokensTabButton);
      console.log('Tokens tab selected successfully');
    } catch (error) {
      console.error('Failed to select Tokens tab', error);
      throw new Error('Failed to select Tokens tab');
    }
  }

  /**
   * Selects a specific token in the token list.
   *
   * @param tokenSymbol - The symbol of the token to select.
   * @throws Will throw an error if the specified token cannot be selected.
   */
  async selectToken(tokenSymbol: string): Promise<void> {
    console.log(`Selecting token: ${tokenSymbol}`);
    try {
      await this.driver.clickElement(
        `[data-testid="multichain-token-list-button-${tokenSymbol}"]`,
      );
      console.log(`Token ${tokenSymbol} selected successfully`);
    } catch (error) {
      console.error(`Failed to select token: ${tokenSymbol}`, error);
      throw new Error(`Failed to select token: ${tokenSymbol}`);
    }
  }
}

export default SendTokenPage;
