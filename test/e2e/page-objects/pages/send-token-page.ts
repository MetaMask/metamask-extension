import { Driver } from '../../webdriver/driver';

class SendTokenPage {
  private driver: Driver;

  private inputRecipient: string;

  private inputAmount: string;

  private scanButton: string;

  private continueButton: object;

  private ensAddressListItem: string;

  private ensAddressAsRecipient: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.inputAmount = '.unit-input__input';
    this.inputRecipient = '[data-testid="ens-input"]';
    this.scanButton = '[data-testid="ens-qr-scan-button"]';
    this.ensAddressListItem = '.address-list-item';
    this.ensAddressAsRecipient = '.ens-input__selected-input__title';
    this.continueButton = {
      text: 'Continue',
      tag: 'button',
    };
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.inputRecipient);
      await this.driver.waitForSelector(this.scanButton);
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
    await this.driver.waitForSelector(this.inputAmount);
    await this.driver.pasteIntoField(this.inputAmount, amount);
  }

  async goToNextScreen(): Promise<void> {
    await this.driver.clickElement(this.continueButton);
  }

  /**
   * This function verifies that an ENS domain resolves to the specified address on the send token screen.
   *
   * @param ensDomain - The ENS domain name to be resolved (e.g., "test.eth").
   * @param address - The expected Ethereum address that the ENS domain should resolve to.
   * @returns A promise that resolves when the ENS domain is verified to resolve to the specified address.
   */
  async check_ensAddressResolution(
    ensDomain: string,
    address: string,
  ): Promise<void> {
    console.log(
      `Verify that ens domain ${ensDomain} is resolved as address ${address} on send token screen`,
    );
    // check if ens domain is resolved
    await this.driver.waitForSelector({
      text: ensDomain,
      css: '[data-testid="address-list-item-label"]',
    });
    await this.driver.waitForSelector({
      text: address,
      css: '[data-testid="address-list-item-address"]',
    });
    // select the resolved adress
    await this.driver.clickElement(this.ensAddressListItem);
    // user should be able to send token to the resolved address
    await this.driver.waitForSelector({
      css: this.ensAddressAsRecipient,
      text: ensDomain + address,
    });
  }
}

export default SendTokenPage;
