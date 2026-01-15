import { dataTestIds } from '@metamask/test-dapp-tron';
import { Driver } from '../../webdriver/driver';
import { regularDelayMs } from '../../helpers';
import { WINDOW_TITLES } from '../../constants';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

export class TestDappTron {
  private readonly driver: Driver;

  private readonly tronChainDisplay = {
    text: 'Mainnet',
    css: 'option',
  };

  private readonly walletModalSelector = '.adapter-modal-wrapper';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Open the tron test dapp page.
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
      await this.driver.waitForSelector(this.tronChainDisplay);
    } catch (e) {
      console.log(
        'Timeout while waiting for Tron Test Dapp page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Tron Test Dapp page is loaded');
  }

  /**
   * Focus on the tron test dapp window.
   */
  async switchTo() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TronTestDApp);
    await this.checkPageIsLoaded();
  }

  async clickUpdateEndpointButton() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.header.updateEndpoint,
      tag: 'button',
    });
  }

  /**
   * Get wallet modal.
   *
   * @returns The wallet modal component helper methods.
   */
  async getWalletModal() {
    await this.driver.waitForSelector(this.walletModalSelector);

    const metaMaskButton = await this.driver.findElement({
      css: '.adapter-react-button',
      text: 'MetaMask',
    });

    return {
      connectToMetaMaskWallet: async () => {
        await metaMaskButton.click();
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
      disconnect: async () => {
        await this.driver.clickElement({
          testId: dataTestIds.testPage.header.disconnect,
          tag: 'button',
        });

        await this.driver.delay(regularDelayMs);

        const disconnectButton = await this.driver.findElement({
          css: '.adapter-dropdown-list-item',
          text: 'Disconnect',
        });

        await disconnectButton.click();
      },
      getAccount: async () => {
        const account = await this.getElementText(
          dataTestIds.testPage.header.account,
        );
        return account.split('\n')[0].trim();
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
   * Get Sign TRX tests.
   *
   * @returns The Sign TRX component helper methods.
   */
  async getSignTrxTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.sendTRX.id);

    return {
      setRecipientAddress: (address: string) =>
        this.setInputValue(dataTestIds.testPage.sendTRX.address, address),
      setAmount: (amount: string) =>
        this.setInputValue(dataTestIds.testPage.sendTRX.amount, amount),
      signTransaction: async () =>
        await this.clickElement(dataTestIds.testPage.sendTRX.signTransaction),
      getSignedTransaction: async () =>
        await this.getSignedTransaction(
          dataTestIds.testPage.sendTRX.signedTransaction,
        ),
    };
  }

  /**
   * Get Sign and Send TRX tests.
   *
   * @returns The Sign and Send TRX component helper methods.
   */
  async getSignAndSendTrxTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.sendTRX.id);

    return {
      setRecipientAddress: (address: string) =>
        this.setInputValue(dataTestIds.testPage.sendTRX.address, address),
      setAmount: (amount: string) =>
        this.setInputValue(dataTestIds.testPage.sendTRX.amount, amount),
      signAndSendTransaction: async () =>
        await this.clickElement(dataTestIds.testPage.sendTRX.sendTransaction),
      getTransactionHash: async () =>
        await this.getSignedTransaction(
          dataTestIds.testPage.sendTRX.transactionHash,
        ),
    };
  }

  /**
   * Get Sign USDT tests.
   *
   * @returns The Sign USDT component helper methods.
   */
  async getSignUsdtTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.sendUSDT.id);

    return {
      setRecipientAddress: (address: string) =>
        this.setInputValue(dataTestIds.testPage.sendUSDT.address, address),
      setAmount: (amount: string) =>
        this.setInputValue(dataTestIds.testPage.sendUSDT.amount, amount),
      signTransaction: async () =>
        await this.clickElement(dataTestIds.testPage.sendUSDT.signTransaction),
      getSignedTransaction: async () =>
        await this.getSignedTransaction(
          dataTestIds.testPage.sendUSDT.signedTransaction,
        ),
    };
  }

  /**
   * Get Sign USDT tests.
   *
   * @returns The Sign USDT component helper methods.
   */
  async getSignAndSendUsdtTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.sendUSDT.id);

    return {
      setRecipientAddress: (address: string) =>
        this.setInputValue(dataTestIds.testPage.sendUSDT.address, address),
      setAmount: (amount: string) =>
        this.setInputValue(dataTestIds.testPage.sendUSDT.amount, amount),
      signTransaction: async () =>
        await this.clickElement(dataTestIds.testPage.sendUSDT.sendTransaction),
      getTransactionHash: async () =>
        await this.getSignedTransaction(
          dataTestIds.testPage.sendUSDT.transactionHash,
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
   * Get the text of an element by its data-testid.
   *
   * @param testId - The data-testid of the element.
   * @returns The text of the element.
   */
  private async getElementText(testId: string) {
    const element = await this.driver.findElement(
      this.getElementSelectorTestId(testId),
    );
    return element.getText();
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
   * Click an element by its data-testid.
   *
   * @param id - The data-testid of the element to click.
   */
  private async clickElement(id: string) {
    await this.driver.clickElement(this.getElementSelectorTestId(id));
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
   * Get signed transaction from an element by its data-testid.
   *
   * @param id - The data-testid of the element containing signed transaction.
   * @returns The signed transaction.
   */
  private async getSignedTransaction(id: string) {
    const element = await this.driver.findElement(
      this.getElementSelectorTestId(id),
    );
    return await element.getText();
  }
}
