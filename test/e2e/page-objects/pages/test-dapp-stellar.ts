import { dataTestIds } from '@metamask/test-dapp-stellar';
import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../constants';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

export class TestDappStellar {
  private readonly connectButtonSelector = {
    testId: dataTestIds.testPage.header.connect,
    tag: 'button',
  };

  private readonly connectedAccountSelectorTestId = `[data-testid="${dataTestIds.testPage.header.account}"]`;

  private readonly connectedStatusSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.connectionStatus}"]`,
    text: 'Connected',
  };

  private readonly disconnectButtonSelector = {
    testId: dataTestIds.testPage.header.disconnect,
    tag: 'button',
  };

  private readonly driver: Driver;

  private readonly metamaskButtonSelector = {
    css: '.stellar-wallets-kit li',
    text: 'MetaMask',
  };

  private readonly notConnectedStatusSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.connectionStatus}"]`,
    text: 'Not connected',
  };

  private readonly signedMessageSelectorTestId = `[data-testid="${dataTestIds.testPage.signMessage.signedMessage}"]`;

  private readonly walletModalSelector = '.stellar-wallets-kit';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector({
        testId: dataTestIds.testPage.header.id,
      });
      await this.driver.waitForSelector({
        testId: dataTestIds.testPage.header.connectionStatus,
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

  async connect() {
    await this.driver.clickElement(this.connectButtonSelector);
  }

  async disconnect() {
    await this.driver.clickElement(this.disconnectButtonSelector);
  }

  async findConnectedAccount(account: string) {
    await this.driver.findElement({
      css: this.connectedAccountSelectorTestId,
      text: account,
    });
  }

  async findHeaderConnectedState() {
    await this.driver.findElement(this.connectedStatusSelector);
  }

  async findHeaderNotConnectedState() {
    await this.driver.findElement(this.notConnectedStatusSelector);
  }

  async findSelectedNetwork(
    networkKey: 'pubnet' | 'testnet' | 'futurenet',
  ) {
    const scopeByNetworkKey = {
      pubnet: 'stellar:pubnet',
      testnet: 'stellar:testnet',
      futurenet: 'stellar:futurenet',
    } as const;

    await this.driver.waitUntil(
      async () => {
        const select = await this.driver.findElement({
          testId: dataTestIds.testPage.header.network,
        });
        const value = await select.getAttribute('value');
        if (value === networkKey) {
          return true;
        }

        const adapterScope = await this.driver.executeScript(
          'return localStorage.getItem("metamaskStellarAdapterScope");',
        );

        return adapterScope === scopeByNetworkKey[networkKey];
      },
      { interval: 100, timeout: 15000 },
    );
  }

  async findSignedMessage(signedMessage: string) {
    await this.driver.findElement({
      css: this.signedMessageSelectorTestId,
      text: signedMessage,
    });
  }

  async findSignedMessagePresent() {
    const element = await this.driver.findElement(
      this.signedMessageSelectorTestId,
    );
    const text = await element.getText();
    if (!text || text.trim().length === 0) {
      throw new Error('Expected signed message to be present');
    }
  }

  async findSignedTransactionPresent() {
    const element = await this.driver.findElement({
      testId: dataTestIds.testPage.signTransaction.signedTransaction,
    });
    const text = await element.getText();
    if (!text || text.trim().length === 0) {
      throw new Error('Expected signed transaction to be present');
    }
  }

  async getSignMessageErrorIfPresent(): Promise<string | null> {
    try {
      const errorElements = await this.driver.findElements({
        css: `[data-testid="${dataTestIds.testPage.signMessage.id}"] p`,
      });
      for (const element of errorElements) {
        const text = await element.getText();
        if (text?.trim()) {
          return text.trim();
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  async getWalletModal() {
    await this.driver.waitForSelector(this.walletModalSelector);
    await this.driver.waitForSelector(this.metamaskButtonSelector, {
      timeout: 15000,
    });

    return {
      connectToMetaMaskWallet: async () => {
        await this.driver.clickElement(this.metamaskButtonSelector);
      },
    };
  }

  async loadExampleTransactionXdr() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.signTransaction.loadExampleXdr,
    });
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
    const networkSelectTestId = dataTestIds.testPage.header.network;
    await this.driver.executeScript(
      `
        const select = document.querySelector('[data-testid="${networkSelectTestId}"]');
        if (!select) {
          throw new Error('Network select not found');
        }
        select.value = arguments[0];
        select.dispatchEvent(new Event('change', { bubbles: true }));
      `,
      networkKey,
    );
    await this.findSelectedNetwork(networkKey);
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

  async signTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.signTransaction.signTransaction,
    });
  }

  async switchTo() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.StellarTestDApp);
    await this.checkPageIsLoaded();
  }
}
