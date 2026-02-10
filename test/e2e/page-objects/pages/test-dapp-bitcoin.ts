import { dataTestIds } from '@metamask/test-dapp-bitcoin';
import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { consoleLoggingIntegration } from '@sentry/node';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

export class TestDappBitcoin {
  private readonly driver: Driver;

  private readonly bitcoinChainDisplay = {
    selector: dataTestIds.testPage.header.network,
    value: 'bitcoin:mainnet',
  };

  private readonly headerConnectionStateSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.connectionStatus}"]`,
    text: 'Connected',
  };

  private readonly headerConnectionNotConnectedStateSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.connectionStatus}"]`,
    text: 'Not connected',
  };

  private readonly connectedAccountSelectorTestId = `[data-testid="${dataTestIds.testPage.header.account}"]`;

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
    await this.checkPageIsLoaded();
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      const element = await this.driver.waitForSelector({testId: this.bitcoinChainDisplay.selector});
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
   * Find the header connected state.
   */
  async findHeaderConnectedState() {
    await this.driver.findElement(this.headerConnectionStateSelector);
  }

  /**
   * Find the header not connected state.
   */
  async findHeaderNotConnectedState() {
    await this.driver.findElement(this.headerConnectionNotConnectedStateSelector);
  }

  async connectToWallet(
    lib: 'sats-connect' | 'wallet-standard' = 'sats-connect',
  ) {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.header.connect,
      tag: 'button',
    })

    const walletButtons = await this.driver.findElements({testId: dataTestIds.testPage.walletSelectionModal.walletOption});

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
  }

  async disconnect() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.header.disconnect,
      tag: 'button',
    })
  }
  
  /**
   * Find the connected account.
   *
   * @param account - The account to find.
   */
  async findConnectedAccount(account: string) {
    await this.driver.findElement({
      css: this.connectedAccountSelectorTestId,
      text: account,
    });
  }

  /**
   * Select the network.
   *
   * @param label - The network to select.
   */
  async selectNetwork(label: 'Mainnet' | 'Testnet') {
    const selectEl = await this.driver.findElement({testId: dataTestIds.testPage.header.network});
    await selectEl.sendKeys(label);
  }

  async setMessage (message: string) {
    await this.setInputValue(dataTestIds.testPage.signMessage.message, message)
  }
  
  async signMessage () {
    await this.driver.clickElement(dataTestIds.testPage.signMessage.signMessage)
  }

  async verifySignedMessage(signedMessage: string) {
    await this.driver.findElement({
      css: `[data-testid="${dataTestIds.testPage.signMessage.signedMessage}"]`,
      text: signedMessage,
    });
  }
  
  async setRecepient (message: string) {
    await this.setInputValue(dataTestIds.testPage.sendTransaction.recipient, message);
  }

  async setAmount (message: string) {
    this.setInputValue(dataTestIds.testPage.sendTransaction.amout, message);
  }

  async sendTransaction() {
    await this.driver.clickElement(
      dataTestIds.testPage.sendTransaction.sendTransaction,
    )
  }
  
  async verifyTransactionHash(transactionHash: string) {
    await this.driver.findElement({
      css: `[data-testid="${dataTestIds.testPage.sendTransaction.txId}"]`,
      text: transactionHash,
    });
  }


  async setPsbt(psbt: string) {
    await this.setInputValue(dataTestIds.testPage.signTransaction.psbt, psbt);
  }

  async signPsbt () {
    await this.driver.clickElement(
      dataTestIds.testPage.signTransaction.signTransaction,
    );
  }

  async verifySignedPsbt(signedPsbt: string) {
    await this.driver.findElement({
      css: `[data-testid="${dataTestIds.testPage.signTransaction.signedPsbt}"]`,
      text: signedPsbt,
    });
  }

  /**
   * Switch to the mainnet network.
   */
  async switchToMainnet() {
    await this.driver.clickElement(
      dataTestIds.testPage.header.network,
    )
    
    await this.driver.clickElement(
      dataTestIds.testPage.header.networks.mainnet,
    )
  }

  /**
   * Set the value of an input element by its data-testid.
   *
   * @param id - The data-testid of the input element.
   * @param value - The value to set in the input element.
   */
  private async setInputValue(id: string, value: string) {
    await this.driver.fill({testId: id}, value);
  }
}
