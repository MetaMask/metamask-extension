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
  private readonly amountInputSelector = {
    testId: dataTestIds.testPage.sendTransaction.amout,
  };

  private readonly connectButtonSelector = {
    testId: dataTestIds.testPage.header.connect,
    tag: 'button',
  };

  private readonly connectedAccountSelector = {
    css: `[data-testid="${dataTestIds.testPage.header.account}"]`,
  };

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

  private readonly mainnetNetworkOptionSelector = {
    testId: dataTestIds.testPage.header.networks.mainnet,
  };

  private readonly messageInputSelector = {
    testId: dataTestIds.testPage.signMessage.message,
  };

  private readonly metamaskWalletOptionSelector = {
    testId: dataTestIds.testPage.walletSelectionModal.walletOption,
    text: 'MetaMask',
  };

  private readonly networkSelector = {
    testId: dataTestIds.testPage.header.network,
  };

  private readonly psbtInputSelector = {
    testId: dataTestIds.testPage.signTransaction.psbt,
  };

  private readonly recipientInputSelector = {
    testId: dataTestIds.testPage.sendTransaction.recipient,
  };

  private readonly satsConnectV3ButtonSelector = {
    testId: dataTestIds.testPage.walletSelectionModal.satsConnectV3Button,
    tag: 'button',
  };

  private readonly satsConnectV4ButtonSelector = {
    testId: dataTestIds.testPage.walletSelectionModal.satsConnectV4Button,
    tag: 'button',
  };

  private readonly sendTransactionButtonSelector = {
    testId: dataTestIds.testPage.sendTransaction.sendTransaction,
  };

  private readonly signedMessageSelector = {
    testId: dataTestIds.testPage.signMessage.signedMessage,
  };

  private readonly signedPsbtSelector = {
    testId: dataTestIds.testPage.signTransaction.signedPsbt,
  };

  private readonly signMessageButtonSelector = {
    testId: dataTestIds.testPage.signMessage.signMessage,
  };

  private readonly signPsbtButtonSelector = {
    testId: dataTestIds.testPage.signTransaction.signTransaction,
  };

  private readonly standardButtonSelector = {
    testId: dataTestIds.testPage.walletSelectionModal.standardButton,
    tag: 'button',
  };

  private readonly transactionHashSelector = {
    css: `[data-testid="${dataTestIds.testPage.sendTransaction.txId}"]`,
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.networkSelector);
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
    await this.driver.waitForSelector({
      ...this.connectedAccountSelector,
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
    const selectEl = await this.driver.findElement(this.networkSelector);
    await selectEl.sendKeys(label);
  }

  async sendTransaction() {
    await this.driver.clickElement(this.sendTransactionButtonSelector);
  }

  async setAmount(message: string) {
    await this.setInputValue(this.amountInputSelector, message);
  }

  private async setInputValue(selector: { testId: string }, value: string) {
    await this.driver.fill(selector, value);
  }

  async setMessage(message: string) {
    await this.setInputValue(this.messageInputSelector, message);
  }

  async setPsbt(psbt: string) {
    await this.setInputValue(this.psbtInputSelector, psbt);
  }

  async setRecepient(message: string) {
    await this.setInputValue(this.recipientInputSelector, message);
  }

  async signMessage() {
    await this.driver.clickElement(this.signMessageButtonSelector);
  }

  async signPsbt() {
    await this.driver.clickElement(this.signPsbtButtonSelector);
  }

  async switchTo() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.BitcoinTestDApp);
    await this.checkPageIsLoaded();
  }

  async switchToMainnet() {
    await this.driver.clickElement(this.networkSelector);

    await this.driver.clickElement(this.mainnetNetworkOptionSelector);
  }

  async verifySignedMessage(signedMessage: string) {
    await this.driver.waitForSelector({
      ...this.signedMessageSelector,
      text: signedMessage,
    });
  }

  async verifySignedPsbt(unsignedPsbt: string) {
    // Wait until the element is populated with base64 PSBT data (it starts
    // with the "cHNidP" magic prefix) so we never read a stale or empty
    // element before asserting it differs from the unsigned input.
    const signedPsbtElement = await this.driver.waitForSelector({
      ...this.signedPsbtSelector,
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
    await this.driver.waitForSelector({
      ...this.transactionHashSelector,
      text: transactionHash,
    });
  }
}
