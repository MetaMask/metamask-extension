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
    await this.checkPageIsLoaded();
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

  async findHeaderConnectedState () {
    await this.driver.findElement(this.headerConnectionStateSelector);
  }
  async findHeaderNotConnectedState() {
    await this.driver.findElement(
      this.headerConnectionNotConnectedStateSelector,
    );
  }

  async connect() {
    await this.driver.clickElement(this.connectButtonSelector)
  }
  
  async disconnect() {
    await this.driver.clickElement(this.disconnectButtonSelector);

    await this.driver.clickElement(
      this.disconnectButtonDropdownItemSelector,
    );
  }

  async findConnectedAccount(account: string){
    await this.driver.findElement({
      css: this.connectedAccountSelectorTestId,
      text: account,
    });
  }

  async setMessage(message: string) {
    await this.driver.fill({ testId: dataTestIds.testPage.signMessage.message }, message)
  }

  async signMessage() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.signMessage.signMessage,
    })
  }
  async findSignedMessage(signedMessage: string) {
    await this.driver.findElement({
      css: this.signedMessageSelectorTestId,
      text: signedMessage,
    })
  }


  async setTRXRecipientAddress(address: string) {
    await this.driver.fill({testId: dataTestIds.testPage.sendTRX.address}, address)
  }

  async setTRXAmount(amount: string) {
    await this.driver.fill({testId: dataTestIds.testPage.sendTRX.amount}, amount)
  }

  async signTRXTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.sendTRX.signTransaction,
    })
  }

  async sendTRXTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.sendTRX.sendTransaction,
    })
  }

  async findTRXTransactionHash(transactionHash: string) {
    await this.driver.findElement({
      css: this.trxTransactionHashSelectorTestId,
      text: transactionHash,
    })
  }

  async findSignedTRXTransaction() {
    await this.driver.findElement({
      testId: dataTestIds.testPage.sendTRX.signedTransaction,
    })
  }

  async setUSDTRecipientAddress(address: string) {
    await this.driver.fill({testId: dataTestIds.testPage.sendUSDT.address}, address)
  }

  async setUSDTAmount(amount: string) {
    await this.driver.fill({testId: dataTestIds.testPage.sendUSDT.amount}, amount)
  }

  async signUSDTTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.sendUSDT.signTransaction,
    })
  }

  async findUSDTTransactionHash(transactionHash: string) {
    await this.driver.findElement({
      css: this.usdtTransactionHashSelectorTestId,
      text: transactionHash,
    })
  }

  async sendUSDTTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.sendUSDT.sendTransaction,
    })
  }

  async findSignedUSDTTransaction() {
    await this.driver.findElement({
      testId: dataTestIds.testPage.sendUSDT.signedTransaction,
    })
  }
}
