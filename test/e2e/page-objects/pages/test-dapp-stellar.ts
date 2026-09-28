import { dataTestIds } from '@metamask/test-dapp-stellar';
import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

export class TestDappStellar {
  private readonly connectButtonSelector = {
    tag: 'button',
    testId: dataTestIds.testPage.header.connect,
  };

  private readonly connectedAccountSelector = `[data-testid="${dataTestIds.testPage.header.account}"]`;

  private readonly disconnectButtonSelector = {
    tag: 'button',
    testId: dataTestIds.testPage.header.disconnect,
  };

  private readonly driver: Driver;

  private readonly headerConnectionNotConnectedStateSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.connectionStatus}"]`,
    text: 'Not connected',
  };

  private readonly headerConnectionStateSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.connectionStatus}"]`,
    text: 'Connected',
  };

  private readonly metaMaskWalletButtonSelector = {
    css: '.stellar-wallets-kit li',
    text: 'MetaMask',
  };

  private readonly networkSelectSelector = `[data-testid="${dataTestIds.testPage.header.network}"]`;

  private readonly selectedNetworkOptionSelector = (
    networkKey: 'pubnet' | 'testnet' | 'futurenet',
  ) => `${this.networkSelectSelector} option[value="${networkKey}"]:checked`;

  private readonly signAuthEntryButtonSelector = {
    testId: dataTestIds.testPage.signAuthEntry.signAuthEntry,
  };

  private readonly signAuthEntryInputSelector = {
    testId: dataTestIds.testPage.signAuthEntry.authEntry,
  };

  private readonly signedAuthEntrySelector = `[data-testid="${dataTestIds.testPage.signAuthEntry.signedAuthEntry}"]:not(:empty)`;

  private readonly signedMessageSelector = `[data-testid="${dataTestIds.testPage.signMessage.signedMessage}"]:not(:empty)`;

  private readonly signedTransactionSelector = `[data-testid="${dataTestIds.testPage.signTransaction.signedTransaction}"]:not(:empty)`;

  private readonly signMessageButtonSelector = {
    testId: dataTestIds.testPage.signMessage.signMessage,
  };

  private readonly signMessageInputSelector = {
    testId: dataTestIds.testPage.signMessage.message,
  };

  private readonly signTransactionButtonSelector = {
    testId: dataTestIds.testPage.signTransaction.signTransaction,
  };

  private readonly transactionExampleXdrButtonSelector = {
    testId: dataTestIds.testPage.signTransaction.loadExampleXdr,
  };

  private readonly walletModalSelector = '.stellar-wallets-kit';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.networkSelectSelector);
    } catch (e) {
      console.log(
        'Timeout while waiting for Stellar Test Dapp page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Stellar Test Dapp page is loaded');
  }

  async connect() {
    await this.driver.clickElement(this.connectButtonSelector);
  }

  async disconnect() {
    await this.driver.clickElement(this.disconnectButtonSelector);
  }

  async findConnectedAccount(account: string) {
    await this.driver.findElement({
      css: this.connectedAccountSelector,
      text: account,
    });
  }

  async findHeaderConnectedState() {
    await this.driver.findElement(this.headerConnectionStateSelector);
  }

  async findHeaderNotConnectedState() {
    await this.driver.findElement(
      this.headerConnectionNotConnectedStateSelector,
    );
  }

  async getSignedAuthEntry(): Promise<string> {
    const signedAuthEntryElement = await this.driver.waitForSelector(
      this.signedAuthEntrySelector,
    );
    return signedAuthEntryElement.getText();
  }

  async getSignedMessage(): Promise<string> {
    const signedMessageElement = await this.driver.waitForSelector(
      this.signedMessageSelector,
    );
    return signedMessageElement.getText();
  }

  async getSignedTransaction(): Promise<string> {
    const signedTransactionElement = await this.driver.waitForSelector(
      this.signedTransactionSelector,
    );
    return signedTransactionElement.getText();
  }

  async getWalletModal() {
    await this.driver.waitForSelector(this.walletModalSelector);

    return {
      connectToMetaMaskWallet: async () => {
        await this.driver.clickElement(this.metaMaskWalletButtonSelector);
      },
    };
  }

  async loadExampleXdr() {
    await this.driver.clickElement(this.transactionExampleXdrButtonSelector);
  }

  async openTestDappPage({
    url = DAPP_URL,
  }: {
    url?: string;
  } = {}): Promise<void> {
    await this.driver.openNewPage(url);
    await this.checkPageIsLoaded();
  }

  async selectNetwork(networkKey: 'pubnet' | 'testnet' | 'futurenet') {
    await this.driver.executeScript(
      `const select = document.querySelector(arguments[0]);
       if (!select) {
         throw new Error('Stellar network select not found');
       }
       select.value = arguments[1];
       select.dispatchEvent(new Event('change', { bubbles: true }));`,
      this.networkSelectSelector,
      networkKey,
    );
  }

  async setAuthEntry(authEntry: string) {
    await this.driver.fill(this.signAuthEntryInputSelector, authEntry);
  }

  async setMessage(message: string) {
    await this.driver.fill(this.signMessageInputSelector, message);
  }

  async signAuthEntry() {
    await this.driver.clickElement(this.signAuthEntryButtonSelector);
  }

  async signMessage() {
    await this.driver.clickElement(this.signMessageButtonSelector);
  }

  async signTransaction() {
    await this.driver.clickElement(this.signTransactionButtonSelector);
  }

  async switchTo() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.StellarTestDApp);
    await this.checkPageIsLoaded();
  }

  async verifySelectedNetwork(networkKey: 'pubnet' | 'testnet' | 'futurenet') {
    await this.driver.waitForSelector(
      this.selectedNetworkOptionSelector(networkKey),
    );
  }
}
