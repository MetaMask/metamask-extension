import { dataTestIds } from '@metamask/test-dapp-tron';
import { Driver } from '../../webdriver/driver';
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

  private readonly metamaskButtonSelector = {
    css: '.adapter-react-button',
    text: 'MetaMask',
  };

  private readonly headerConnectionStateSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.connectionStatus}"]`,
    text: 'Connected',
  };

  private readonly headerConnectionNotConnectedStateSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.connectionStatus}"]`,
    text: 'Not connected',
  };

  private readonly connectButtonSelector = {
    testId: dataTestIds.testPage.header.connect,
    tag: 'button',
  };

  private readonly disconnectButtonSelector = {
    testId: dataTestIds.testPage.header.disconnect,
    tag: 'button',
  };

  private readonly disconnectButtonDropdownItemSelector = {
    css: '.adapter-dropdown-list-item',
    text: 'Disconnect',
  };

  private readonly connectedAccountSelectorTestId = `[data-testid="${dataTestIds.testPage.header.account}"]`;

  private readonly signedMessageSelectorTestId = `[data-testid="${dataTestIds.testPage.signMessage.signedMessage}"]`;

  private readonly trxTransactionHashSelectorTestId = `[data-testid="${dataTestIds.testPage.sendTRX.transactionHash}"]`;
  
  private readonly usdtTransactionHashSelectorTestId = `[data-testid="${dataTestIds.testPage.sendUSDT.transactionHash}"]`;

  constructor(driver: Driver) {
    this.driver = driver;
  };

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

  /**
   * Get wallet modal.
   *
   * @returns The wallet modal component helper methods.
   */
  async getWalletModal() {
    await this.driver.waitForSelector(this.walletModalSelector);
    
    return {
      connectToMetaMaskWallet: async () => {
        await this.driver.clickElement(this.metamaskButtonSelector);
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
      findHeaderConnectedState: async () => {
        await this.driver.findElement(this.headerConnectionStateSelector);
      },
      findHeaderNotConnectedState: async () => {
        await this.driver.findElement(this.headerConnectionNotConnectedStateSelector);
      },
      connect: async () =>
        await this.driver.clickElement(this.connectButtonSelector),
      disconnect: async () => {
        await this.driver.clickElement(this.disconnectButtonSelector);

        await this.driver.clickElement(this.disconnectButtonDropdownItemSelector);
      },
      findConnectedAccount: async (account: string) => {
        await this.driver.findElement({
          css: this.connectedAccountSelectorTestId,
          text: account,
        });
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
        await this.driver.clickElement({testId: dataTestIds.testPage.signMessage.signMessage}),
      findSignedMessage: async (signedMessage: string) =>
        await this.driver.findElement({
          css: this.signedMessageSelectorTestId,
          text: signedMessage,
        }),
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
      signTransaction: async () =>
        await this.driver.clickElement({testId: dataTestIds.testPage.sendTRX.signTransaction}),
      sendTransaction: async () =>
        await this.driver.clickElement({testId: dataTestIds.testPage.sendTRX.sendTransaction}),
      findTransactionHash: async (transactionHash: string) =>
        await this.driver.findElement({
          css: this.trxTransactionHashSelectorTestId,
          text: transactionHash,
        }),
      findSignedTransaction: async () =>
        await this.driver.findElement({
          testId: dataTestIds.testPage.sendTRX.signedTransaction,
        })
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
        await this.driver.clickElement({testId:dataTestIds.testPage.sendUSDT.signTransaction}),
      sendTransaction: async () =>
        await this.driver.clickElement({testId:dataTestIds.testPage.sendUSDT.sendTransaction}),
      findTransactionHash: async (transactionHash: string) =>
        await this.driver.findElement({
          css: this.usdtTransactionHashSelectorTestId,
          text: transactionHash,
        }),
      findSignedTransaction: async () =>
        await this.driver.findElement({
          testId: dataTestIds.testPage.sendUSDT.signedTransaction,
        })
    };
  }

  /**
   * Wait for an element to be present in the DOM by its data-testid.
   *
   * @param id - The data-testid of the element to wait for.
   * @returns
   */
  private async waitSelectorTestId(id: string) {
    await this.driver.findElement({ testId: id });
  }

  /**
   * Set the value of an input element by its data-testid.
   *
   * @param id - The data-testid of the input element.
   * @param value - The value to set in the input element.
   */
  private async setInputValue(id: string, value: string) {
    await this.driver.fill({ testId: id }, value);
  }
}
