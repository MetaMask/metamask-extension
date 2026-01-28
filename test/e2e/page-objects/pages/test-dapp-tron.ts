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

  /**
   * Find the header connected state.
   */
  async findHeaderConnectedState () {
    await this.driver.findElement(this.headerConnectionStateSelector);
  }

  /**
   * Find the header not connected state.
   */
  async findHeaderNotConnectedState() {
    await this.driver.findElement(
      this.headerConnectionNotConnectedStateSelector,
    );
  }

  /**
   * Connect to the tron test dapp.
   */
  async connect() {
    await this.driver.clickElement(this.connectButtonSelector)
  }
  
  /**
   * Disconnect from the tron test dapp.
   */
  async disconnect() {
    await this.driver.clickElement(this.disconnectButtonSelector);

    await this.driver.clickElement(
      this.disconnectButtonDropdownItemSelector,
    );
  }

  /**
   * Find the connected account.
   *
   * @param account - The account to find.
   */
  async findConnectedAccount(account: string){
    await this.driver.findElement({
      css: this.connectedAccountSelectorTestId,
      text: account,
    });
  }

  /**
   * Set the message to sign input field.
   *
   * @param message - The message to sign.
   */
  async setMessage(message: string) {
    await this.driver.fill({ testId: dataTestIds.testPage.signMessage.message }, message)
  }

  /**
   * Sign the message.
   */
  async signMessage() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.signMessage.signMessage,
    })
  }

  /**
   * Find the signed message.
   *
   * @param signedMessage - The signed message to find.
   */
  async findSignedMessage(signedMessage: string) {
    await this.driver.findElement({
      css: this.signedMessageSelectorTestId,
      text: signedMessage,
    })
  }


  /**
   * Set the TRX recipient address.
   *
   * @param address - The TRX recipient address to set.
   */
  async setTRXRecipientAddress(address: string) {
    await this.driver.fill({testId: dataTestIds.testPage.sendTRX.address}, address)
  }

  /**
   * Set the TRX amount.
   *
   * @param amount - The TRX amount to set.
   */
  async setTRXAmount(amount: string) {
    await this.driver.fill({testId: dataTestIds.testPage.sendTRX.amount}, amount)
  }

  /**
   * Sign the TRX transaction.
   */
  async signTRXTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.sendTRX.signTransaction,
    })
  }

  /**
   * Send the TRX transaction.
   */
  async sendTRXTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.sendTRX.sendTransaction,
    })
  }

  /**
   * Find the TRX transaction hash.
   *
   * @param transactionHash - The TRX transaction hash to find.
   */
  async findTRXTransactionHash(transactionHash: string) {
    await this.driver.findElement({
      css: this.trxTransactionHashSelectorTestId,
      text: transactionHash,
    })
  }

  /**
   * Find the signed TRX transaction.
   */
  async findSignedTRXTransaction() {
    await this.driver.findElement({
      testId: dataTestIds.testPage.sendTRX.signedTransaction,
    })
  }

  /**
   * Set the USDT recipient address.
   *
   * @param address - The USDT recipient address to set.
   */
  async setUSDTRecipientAddress(address: string) {
    await this.driver.fill({testId: dataTestIds.testPage.sendUSDT.address}, address)
  }

  /**
   * Set the USDT amount.
   *
   * @param amount - The USDT amount to set.
   */
  async setUSDTAmount(amount: string) {
    await this.driver.fill({testId: dataTestIds.testPage.sendUSDT.amount}, amount)
  }

  /**
   * Sign the USDT transaction.
   */
  async signUSDTTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.sendUSDT.signTransaction,
    })
  }

  /**
   * Find the USDT transaction hash.
   *
   * @param transactionHash - The USDT transaction hash to find.
   */
  async findUSDTTransactionHash(transactionHash: string) {
    await this.driver.findElement({
      css: this.usdtTransactionHashSelectorTestId,
      text: transactionHash,
    })
  }

  /**
   * Send the USDT transaction.
   */
  async sendUSDTTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.sendUSDT.sendTransaction,
    })
  }

  /**
   * Find the signed USDT transaction.
   */
  async findSignedUSDTTransaction() {
    await this.driver.findElement({
      testId: dataTestIds.testPage.sendUSDT.signedTransaction,
    })
  }
}
