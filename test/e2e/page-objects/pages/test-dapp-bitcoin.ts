import assert from 'assert';
import { dataTestIds, WalletConnectionType } from '@metamask/test-dapp-bitcoin';
import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';

export { WalletConnectionType };

export const availableConnectionTypes: WalletConnectionType[] = [
  WalletConnectionType.Standard,
  WalletConnectionType.SatsConnectV3,
  WalletConnectionType.SatsConnectV4,
];

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

export class TestDappBitcoin {
  private readonly bitcoinChainDisplay = {
    css: `[data-testid="${dataTestIds.testPage.header.network}"]`,
    value: 'bitcoin:mainnet',
  };

  private readonly connectButtonSelector = {
    testId: dataTestIds.testPage.header.connect,
    tag: 'button',
  };

  private readonly connectedAccountSelectorTestId = `[data-testid="${dataTestIds.testPage.header.account}"]`;

  private readonly disconnectButtonSelector = {
    testId: dataTestIds.testPage.header.disconnect,
    tag: 'button',
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

  private readonly metamaskWalletOptionSelector = {
    testId: dataTestIds.testPage.walletSelectionModal.walletOption,
    text: 'MetaMask',
  };

  private readonly satsConnectV3ButtonSelector = {
    testId: dataTestIds.testPage.walletSelectionModal.satsConnectV3Button,
    tag: 'button',
  };

  private readonly satsConnectV4ButtonSelector = {
    testId: dataTestIds.testPage.walletSelectionModal.satsConnectV4Button,
    tag: 'button',
  };

  private readonly standardButtonSelector = {
    testId: dataTestIds.testPage.walletSelectionModal.standardButton,
    tag: 'button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.bitcoinChainDisplay);
    } catch (e) {
      console.log(
        'Timeout while waiting for Bitcoin Test Dapp page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Bitcoin Test Dapp page is loaded');
  }

  async connectToWallet(
    lib: WalletConnectionType = WalletConnectionType.SatsConnectV3,
  ) {
    await this.driver.clickElement(this.connectButtonSelector);

    await this.driver.clickElement(this.metamaskWalletOptionSelector);

    if (lib === WalletConnectionType.SatsConnectV3) {
      await this.driver.clickElement(this.satsConnectV3ButtonSelector);
    } else if (lib === WalletConnectionType.SatsConnectV4) {
      await this.driver.clickElement(this.satsConnectV4ButtonSelector);
    } else {
      await this.driver.clickElement(this.standardButtonSelector);
    }
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
    await this.driver.waitForSelector(this.headerConnectionStateSelector);
  }

  async findHeaderNotConnectedState() {
    await this.driver.waitForSelector(
      this.headerConnectionNotConnectedStateSelector,
    );
  }

  async openTestDappPage({
    url = DAPP_URL,
  }: {
    url?: string;
  } = {}): Promise<void> {
    await this.driver.openNewPage(url);
    await this.checkPageIsLoaded();
  }

  async selectNetwork(label: 'Mainnet' | 'Testnet') {
    const selectEl = await this.driver.findElement({
      testId: dataTestIds.testPage.header.network,
    });
    await selectEl.sendKeys(label);
  }

  async sendTransaction() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.sendTransaction.sendTransaction,
    });
  }

  async setAmount(message: string) {
    await this.setInputValue(
      dataTestIds.testPage.sendTransaction.amout,
      message,
    );
  }

  private async setInputValue(id: string, value: string) {
    await this.driver.fill({ testId: id }, value);
  }

  async setMessage(message: string) {
    await this.setInputValue(dataTestIds.testPage.signMessage.message, message);
  }

  async setPsbt(psbt: string) {
    await this.setInputValue(dataTestIds.testPage.signTransaction.psbt, psbt);
  }

  async setRecepient(message: string) {
    await this.setInputValue(
      dataTestIds.testPage.sendTransaction.recipient,
      message,
    );
  }

  async signMessage() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.signMessage.signMessage,
    });
  }

  async signPsbt() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.signTransaction.signTransaction,
    });
  }

  async switchTo() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);
    await this.checkPageIsLoaded();
  }

  async switchToMainnet() {
    await this.driver.clickElement({
      testId: dataTestIds.testPage.header.network,
    });

    await this.driver.clickElement({
      testId: dataTestIds.testPage.header.networks.mainnet,
    });
  }

  async verifySignedMessage(signedMessage: string) {
    await this.driver.waitForSelector({
      testId: dataTestIds.testPage.signMessage.signedMessage,
      text: signedMessage,
    });
  }

  async verifySignedPsbt(unsignedPsbt: string) {
    // Wait until the element is populated with base64 PSBT data (it starts
    // with the "cHNidP" magic prefix) so we never read a stale or empty
    // element before asserting it differs from the unsigned input.
    const signedPsbtElement = await this.driver.waitForSelector({
      testId: dataTestIds.testPage.signTransaction.signedPsbt,
      text: 'cHNidP',
    });
    const signedPsbt = await signedPsbtElement.getText();

    assert.notStrictEqual(
      signedPsbt,
      unsignedPsbt,
      'Signed PSBT should differ from the unsigned input PSBT',
    );
  }

  async verifyTransactionHash(transactionHash: string) {
    await this.driver.findElement({
      css: `[data-testid="${dataTestIds.testPage.sendTransaction.txId}"]`,
      text: transactionHash,
    });
  }
}
