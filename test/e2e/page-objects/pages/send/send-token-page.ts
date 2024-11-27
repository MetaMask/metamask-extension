import { strict as assert } from 'assert';
import { WebElement } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class SendTokenPage {
  private driver: Driver;

  private readonly assetPickerButton = '[data-testid="asset-picker-button"]';

  private readonly continueButton = {
    text: 'Continue',
    tag: 'button',
  };

  private readonly cancelButton = {
    text: 'Cancel',
    tag: 'button',
  };

  private readonly ensAddressAsRecipient = '[data-testid="ens-input-selected"]';

  private readonly ensResolvedName =
    '[data-testid="multichain-send-page__recipient__item__title"]';

  private readonly assetValue = '[data-testid="account-value-and-suffix"]';

  private readonly inputAmount = '[data-testid="currency-input"]';

  private readonly inputNFTAmount = '[data-testid="nft-input"]';

  private readonly inputRecipient = '[data-testid="ens-input"]';

  private readonly recipientAccount =
    '.multichain-account-list-item__account-name__button';

  private readonly scanButton = '[data-testid="ens-qr-scan-button"]';

  private readonly tokenListButton =
    '[data-testid="multichain-token-list-button"]';

  private readonly toastText = '.toast-text';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async getAssetPickerItems(): Promise<WebElement[]> {
    console.log('Retrieving asset picker items');
    return this.driver.findElements(this.tokenListButton);
  }

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

  async clickSecondTokenListButton() {
    const elements = await this.driver.findElements(this.tokenListButton);
    await elements[1].click();
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

  async fillAmount(amount: string): Promise<void> {
    console.log(`Fill amount input with ${amount} on send token screen`);
    const inputAmount = await this.driver.waitForSelector(this.inputAmount);
    await this.driver.pasteIntoField(this.inputAmount, amount);
    // The return value is not ts-compatible, requiring a temporary any cast to access the element's value. This will be corrected with the driver function's ts migration.
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputValue = await (inputAmount as any).getProperty('value');
    assert.equal(
      inputValue,
      amount,
      `Error when filling amount field on send token screen: the value entered is ${inputValue} instead of expected ${amount}.`,
    );
  }

  async check_networkChange(networkName: string): Promise<void> {
    const toastTextElement = await this.driver.findElement(this.toastText);
    const toastText = await toastTextElement.getText();
    assert.equal(
      toastText,
      `You're now using ${networkName}`,
      'Toast text is correct',
    );
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

  async goToNextScreen(): Promise<void> {
    await this.driver.clickElement(this.continueButton);
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
}

export default SendTokenPage;
