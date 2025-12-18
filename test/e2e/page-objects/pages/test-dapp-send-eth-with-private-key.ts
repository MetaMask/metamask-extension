import { Driver } from '../../webdriver/driver';
import { DAPP_URL } from '../../constants';

class TestDappSendEthWithPrivateKey {
  private readonly driver: Driver;

  private readonly addressInput = '#address';

  private readonly sendEthWithPrivateKeyButton = '#send';

  private readonly successMessage = { css: '#success', text: 'Success' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.addressInput,
        this.sendEthWithPrivateKeyButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Test Dapp send eth with private key page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Test Dapp send eth with private key page is loaded');
  }

  /**
   * Open the test dapp individual request page.
   *
   * @param options - The options for opening the test dapp page.
   * @param options.contractAddress - The contract address to open the dapp with. Defaults to null.
   * @param options.url - The URL of the dapp. Defaults to DAPP_URL.
   * @returns A promise that resolves when the new page is opened.
   */
  async openTestDappSendEthWithPrivateKey({
    contractAddress = null,
    url = DAPP_URL,
  }: {
    contractAddress?: string | null;
    url?: string;
  } = {}): Promise<void> {
    const dappUrl = contractAddress
      ? `${url}/?contract=${contractAddress}`
      : url;
    await this.driver.openNewPage(dappUrl);
  }

  /**
   * Sends ETH by pasting recipient address and clicking send. Waits for success.
   */
  async pasteAddressAndSendEthWithPrivateKey() {
    console.log('Paste address and send eth with private key on test dapp');
    await this.driver.pasteFromClipboardIntoField(this.addressInput);
    await this.driver.clickElement(this.sendEthWithPrivateKeyButton);
    await this.driver.waitForSelector(this.successMessage, { timeout: 15000 });
  }
}

export default TestDappSendEthWithPrivateKey;
