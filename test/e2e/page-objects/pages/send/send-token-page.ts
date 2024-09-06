import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

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

  constructor(driver: Driver) {
    this.driver = driver;
    this.inputRecipient = '[data-testid="ens-input"]';
    this.scanButton = '[data-testid="ens-qr-scan-button"]';
    this.ensResolvedName = '[data-testid="multichain-send-page__recipient__item__title"]';
    this.ensResolvedAddress = '[data-testid="multichain-send-page__recipient__item__subtitle"]';
    this.ensAddressAsRecipient = '[data-testid="ens-input-selected"]';
    this.continueButton = { text: 'Continue', tag: 'button' };
    this.assetPickerButton = '.asset-picker__symbol';
    this.nftTabButton = '[data-testid="nft-tab"]';
    this.nftAssetSelector = '[data-testid="nft-default-image"]';
    this.accountPickerButton = '[data-testid="send-page-account-picker"]';
    this.selectedAssetSymbol = '.asset-picker__symbol';
    this.tokensTabButton = '[data-testid="tokens-tab"]';
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([this.scanButton, this.inputRecipient]);
    } catch (e) {
      console.log('Timeout while waiting for send token screen to be loaded', e);
      throw e;
    }
    console.log('Send token screen is loaded');
  }

  async fillRecipient(recipientAddress: string): Promise<void> {
    console.log(`Fill recipient input with ${recipientAddress} on send token screen`);
    await this.driver.pasteIntoField(this.inputRecipient, recipientAddress);
  }

  public async inputAmount(amount: string): Promise<void> {
    console.log(`Starting inputAmount method with amount: ${amount}`);
    const inputAmountSelector = '[data-testid="currency-input"]';
    const inputAmount = await this.driver.waitForSelector(inputAmountSelector);
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
    console.log(`Completed inputAmount method. Amount ${amount} successfully entered.`);
  }

  async clickContinue(): Promise<void> {
    console.log('Clicking continue button on send token screen');
    await this.driver.clickElement(this.continueButton);
  }

  async selectRecipient(): Promise<void> {
    console.log('Selecting the first recipient from the list');
    await this.driver.clickElement('.multichain-account-list-item');
  }

  async openAssetPicker(): Promise<void> {
    console.log('Opening asset picker');
    await this.driver.clickElement(this.assetPickerButton);
  }

  async selectNFTAsset(): Promise<void> {
    console.log('Selecting NFT asset');
    await this.driver.clickElement(this.nftTabButton);
    await this.driver.clickElement(this.nftAssetSelector);
  }

  async validateSelectedNFT(symbol: string, id: string): Promise<void> {
    console.log(`Validating selected NFT: ${symbol} #${id}`);
    await this.driver.waitForSelector({ css: this.selectedAssetSymbol, text: symbol });
    await this.driver.waitForSelector({ css: 'p', text: id });
  }

  async switchToAccount(accountName: string): Promise<void> {
    console.log(`Switching to account: ${accountName}`);
    await this.driver.clickElement(this.accountPickerButton);
    await this.driver.clickElement({
      css: '.multichain-account-list-item .multichain-account-list-item__account-name__button',
      text: accountName,
    });
  }

  async validateSelectedAsset(assetSymbol: string): Promise<void> {
    console.log(`Validating selected asset: ${assetSymbol}`);
    await this.driver.waitForSelector({ css: this.selectedAssetSymbol, text: assetSymbol });
  }

  async check_ensAddressResolution(ensDomain: string, address: string): Promise<void> {
    console.log(`Check ENS domain resolution: '${ensDomain}' should resolve to address '${address}' on the send token screen.`);
    await this.driver.waitForSelector({ text: ensDomain, css: this.ensResolvedName });
    await this.driver.waitForSelector({ text: address, css: this.ensResolvedAddress });
  }

  async check_ensAddressAsRecipient(ensDomain: string, address: string): Promise<void> {
    await this.driver.clickElement({ text: ensDomain, css: this.ensResolvedName });
    await this.driver.waitForSelector({ css: this.ensAddressAsRecipient, text: ensDomain + address });
    console.log(`ENS domain '${ensDomain}' resolved to address '${address}' and can be used as recipient on send token screen.`);
  }

  async selectTokensTab(): Promise<void> {
    console.log('Selecting Tokens tab');
    await this.driver.clickElement(this.tokensTabButton);
  }

  async selectToken(tokenSymbol: string): Promise<void> {
    console.log(`Selecting token: ${tokenSymbol}`);
    await this.driver.clickElement(`[data-testid="multichain-token-list-button-${tokenSymbol}"]`);
  }
}

export default SendTokenPage;
