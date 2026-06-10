import assert from 'assert';
import { dataTestIds } from '@metamask/test-dapp-stellar';
import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

export class TestDappStellar {
  private readonly driver: Driver;

  private readonly headerConnectionStateSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.connectionStatus}"]`,
    text: 'Connected',
  };

  private readonly headerConnectionNotConnectedStateSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.connectionStatus}"]`,
    text: 'Not connected',
  };

  private readonly connectedAccountSelectorTestId = `[data-testid="${dataTestIds.testPage.header.account}"]`;

  private readonly walletModalSelector = '.stellar-wallets-kit';

  private readonly metaMaskWalletButtonSelector = {
    css: '.stellar-wallets-kit li',
    text: 'MetaMask',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

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
      await this.driver.waitForSelector({
        testId: dataTestIds.testPage.header.network,
      });
    } catch (e) {
      console.log(
        'Timeout while waiting for Stellar Test Dapp page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Stellar Test Dapp page is loaded');
  }

  async switchTo() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.StellarTestDApp);
    await this.checkPageIsLoaded();
  }

  async connect() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.header.connect,
      tag: 'button',
    });
  }

  async disconnect() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.header.disconnect,
      tag: 'button',
    });
  }

  async getWalletModal() {
    await this.driver.waitForSelector(this.walletModalSelector);

    return {
      connectToMetaMaskWallet: async () => {
        await this.driver.clickElement(this.metaMaskWalletButtonSelector);
      },
    };
  }

  async findHeaderConnectedState() {
    await this.driver.findElement(this.headerConnectionStateSelector);
  }

  async findHeaderNotConnectedState() {
    await this.driver.findElement(
      this.headerConnectionNotConnectedStateSelector,
    );
  }

  async findConnectedAccount(account: string) {
    await this.driver.findElement({
      css: this.connectedAccountSelectorTestId,
      text: account,
    });
  }

  async selectNetwork(networkKey: 'pubnet' | 'testnet' | 'futurenet') {
    const networkTestId = dataTestIds.testPage.header.network;
    await this.driver.executeScript(
      `const select = document.querySelector('[data-testid="${networkTestId}"]');
       if (!select) {
         throw new Error('Stellar network select not found');
       }
       select.value = arguments[0];
       select.dispatchEvent(new Event('change', { bubbles: true }));`,
      networkKey,
    );
  }

  async setMessage(message: string) {
    await this.driver.fill(
      { testId: dataTestIds.testPage.signMessage.message },
      message,
    );
  }

  async signMessage() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.signMessage.signMessage,
    });
  }

  async getSignedMessage(): Promise<string> {
    const signedMessageElement = await this.driver.waitForSelector(
      `[data-testid="${dataTestIds.testPage.signMessage.signedMessage}"]`,
    );
    return signedMessageElement.getText();
  }

  async loadExampleXdr() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.signTransaction.loadExampleXdr,
    });
  }

  async signTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.signTransaction.signTransaction,
    });
  }

  async getSignedTransaction(): Promise<string> {
    const signedTransactionElement = await this.driver.waitForSelector(
      `[data-testid="${dataTestIds.testPage.signTransaction.signedTransaction}"]`,
    );
    return signedTransactionElement.getText();
  }

  async setUsdcRecipient(recipient: string) {
    await this.driver.fill(
      { testId: dataTestIds.testPage.sendUsdc.recipient },
      recipient,
    );
  }

  async setUsdcAmount(amount: string) {
    await this.driver.fill(
      { testId: dataTestIds.testPage.sendUsdc.amount },
      amount,
    );
  }

  async sendUsdc() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.sendUsdc.sendUsdc,
    });
  }

  async verifyTransactionHash(transactionHash: string) {
    await this.driver.findElement({
      css: `[data-testid="${dataTestIds.testPage.sendUsdc.hash}"]`,
      text: transactionHash,
    });
  }

  async verifySignedTransactionDiffersFrom(unsignedXdr: string) {
    const signedTransaction = await this.getSignedTransaction();
    assert.ok(signedTransaction.length > 0);
    assert.notStrictEqual(signedTransaction, unsignedXdr);
  }

  async verifySelectedNetwork(networkKey: 'pubnet' | 'testnet' | 'futurenet') {
    const selectEl = await this.driver.findElement({
      testId: dataTestIds.testPage.header.network,
    });
    const value = await selectEl.getAttribute('value');
    assert.strictEqual(value, networkKey);
  }
}
