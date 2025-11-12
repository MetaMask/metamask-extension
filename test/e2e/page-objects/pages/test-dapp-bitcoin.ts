import { By } from 'selenium-webdriver';
import { dataTestIds } from '@metamask/test-dapp-bitcoin';
import { WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

export class TestDappBitcoin {
  private readonly driver: Driver;

  private readonly bitcoinChainDisplay = {
    selector: dataTestIds.testPage.header.network,
    value: 'bitcoin:mainnet',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Open the bitcoin test dapp page.
   *
   * @param options - The options for opening the test dapp page.
   * @param options.url - The URL of the dapp. Defaults to DAPP_URL.
   * @returns A promise that resolves when the new page is opened.
   */
  async openTestDappPage({
    url = DAPP_URL,
  }: {
    url?: string;
  } = {}): Promise<void> {
    await this.driver.openNewPage(url);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      const element = await this.driver.waitForSelector(
        this.getElementSelectorTestId(this.bitcoinChainDisplay.selector),
      );
      await element.getAttribute('value');
    } catch (e) {
      console.log(
        'Timeout while waiting for Bitcoin Test Dapp page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Bitcoin Test Dapp page is loaded');
  }

  /**
   * Focus on the Bitcoin test dapp window.
   */
  async switchTo() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);
    await this.checkPageIsLoaded();
  }

  /**
   * Get wallet modal.
   *
   * @returns The wallet modal component helper methods.
   */
  async getWalletModal() {
    await this.driver.waitForSelector(
      this.getElementSelectorTestId(
        dataTestIds.testPage.walletSelectionModal.id,
      ),
    );

    const walletButtons = await this.driver.findElements(
      this.getElementSelectorTestId(
        dataTestIds.testPage.walletSelectionModal.walletOption,
      ),
    );

    return {
      connectToMetaMaskWallet: async (
        lib: 'sats-connect' | 'wallet-standard' = 'sats-connect',
      ) => {
        const metaMaskButton = walletButtons[0]; // Assuming MetaMask is always the first button

        if (!metaMaskButton) {
          throw new Error('MetaMask button not found');
        }

        await metaMaskButton.click();

        if (lib === 'sats-connect') {
          await this.driver.clickElement({
            testId: dataTestIds.testPage.walletSelectionModal.satsConnectButton,
            tag: 'button',
          });
        } else {
          await this.driver.clickElement({
            testId: dataTestIds.testPage.walletSelectionModal.standardButton,
            tag: 'button',
          });
        }
      },
    };
  }

  /**
   * Get Header.
   *
   * @returns The Header component helper methods.
   */
  async getHeader() {
    await this.waitSelectorTestId(dataTestIds.testPage.header.id);

    return {
      getConnectionStatus: async () => {
        const element = await this.driver.findElement(
          this.getElementSelectorTestId(
            dataTestIds.testPage.header.connectionStatus,
          ),
        );
        return element.getText();
      },
      connect: async () =>
        await this.driver.clickElement({
          testId: dataTestIds.testPage.header.connect,
          tag: 'button',
        }),
      disconnect: async () =>
        await this.driver.clickElement({
          testId: dataTestIds.testPage.header.disconnect,
          tag: 'button',
        }),
      getAccount: async () =>
        await this.getSolscanShortContent(dataTestIds.testPage.header.account),
      selectNetwork: async (label: 'Mainnet' | 'Testnet') => {
        const selectEl = await this.driver.findElement(
          this.getElementSelectorTestId(dataTestIds.testPage.header.network),
        );
        await selectEl.sendKeys(label);
      },
    };
  }

  /**
   * Get Sign Message tests.
   *
   * @returns The Sign Message component helper methods.
   */
  async getSignMessageTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.signMessage.id);

    return {
      setMessage: (message: string) =>
        this.setInputValue(dataTestIds.testPage.signMessage.message, message),
      signMessage: async () =>
        await this.clickElement(dataTestIds.testPage.signMessage.signMessage),
      getSignedMessage: async () =>
        await this.getSignedMessages(
          dataTestIds.testPage.signMessage.signedMessage,
        ),
    };
  }

  /**
   * Get Sign Transaction tests.
   *
   * @returns The Sign Transaction component helper methods.
   */
  async getSignTransactionTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.signTransaction.id);

    return {
      signTransaction: async () =>
        await this.clickElement(
          dataTestIds.testPage.signTransaction.signTransaction,
        ),
    };
  }

  /**
   * Wait for an element to be present in the DOM by its data-testid.
   *
   * @param id - The data-testid of the element to wait for.
   * @returns
   */
  private async waitSelectorTestId(id: string) {
    await this.driver.findElement(this.getElementSelectorTestId(id));
  }

  /**
   * Get the selector for an element by its data-testid.
   *
   * @param testId - The data-testid of the element.
   * @returns The CSS selector for the element.
   */
  private getElementSelectorTestId(testId: string) {
    return { testId };
  }

  /**
   * Click an element by its data-testid.
   *
   * @param id - The data-testid of the element to click.
   */
  private async clickElement(id: string) {
    await this.driver.clickElement(this.getElementSelectorTestId(id));
  }

  /**
   * Set the value of an input element by its data-testid.
   *
   * @param id - The data-testid of the input element.
   * @param value - The value to set in the input element.
   */
  private async setInputValue(id: string, value: string) {
    await this.driver.fill(this.getElementSelectorTestId(id), value);
  }

  /**
   * Check or uncheck an option by its data-testid.
   *
   * @param id - The data-testid of the checkbox element.
   * @param value - Whether to check or uncheck the checkbox.
   */
  private async checkOption(id: string, value: boolean) {
    const element = await this.driver.findElement(
      this.getElementSelectorTestId(id),
    );
    const isChecked = await element.isSelected();

    if (isChecked !== value) {
      await element.click();
    }
  }

  /**
   * Get signed messages from an element by its data-testid.
   *
   * @param id - The data-testid of the element containing signed messages.
   * @returns An array of signed messages.
   */
  private async getSignedMessages(id: string) {
    const element = await this.driver.findElement(
      this.getElementSelectorTestId(id),
    );
    const value = await element.getText();

    return value.split('\n').map((hash) => hash.trim());
  }

  /**
   * Get the first transaction hash from an element by its data-testid.
   *
   * @param id - The data-testid of the element containing transaction hashes.
   * @returns The first transaction hash.
   */
  private async getSolscanShortContent(id: string) {
    const contents = await this.getSolscanShortContents(id);
    return contents[0];
  }

  /**
   * Get all transaction hashes from an element by its data-testid.
   *
   * @param id - The data-testid of the element containing transaction hashes.
   * @returns An array of transaction hashes.
   */
  private async getSolscanShortContents(id: string) {
    const element = await this.driver.findElement(
      this.getElementSelectorTestId(id),
    );
    const contents = await element.findElements(By.css('.content'));

    return contents.map((content) => content.getText());
  }
}
