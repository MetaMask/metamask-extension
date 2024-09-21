import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

class SendTokenPage {
  private driver: Driver;

  private inputRecipient: string;

  private inputAmount: string;

  private scanButton: string;

  private continueButton: object;

  private ensResolvedName: string;

  private ensAddressAsRecipient: string;

  private ensResolvedAddress: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.inputAmount = '[data-testid="currency-input"]';
    this.inputRecipient = '[data-testid="ens-input"]';
    this.scanButton = '[data-testid="ens-qr-scan-button"]';
    this.ensResolvedName =
      '[data-testid="multichain-send-page__recipient__item__title"]';
    this.ensResolvedAddress =
      '[data-testid="multichain-send-page__recipient__item__subtitle"]';
    this.ensAddressAsRecipient = '[data-testid="ens-input-selected"]';
    this.continueButton = {
      text: 'Continue',
      tag: 'button',
    };
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

  async fillRecipient(recipientAddress: string): Promise<void> {
    console.log(
      `Fill recipient input with ${recipientAddress} on send token screen`,
    );
    await this.driver.pasteIntoField(this.inputRecipient, recipientAddress);
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

  async goToNextScreen(): Promise<void> {
    await this.driver.clickElement(this.continueButton);
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
}

export default SendTokenPage;
