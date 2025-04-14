import { connect } from 'http2';
import { WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { dataTestIds } from '@metamask/test-dapp-solana'
import { By } from 'selenium-webdriver';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

export class TestDappSolana {
  constructor(private readonly driver: Driver) {}

  /**
   * Open the solana test dapp page.
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

  /**
   * Focus on the Solana test dapp window.
   */
  async switchTo() {
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.SolanaTestDApp);
  }

  /**
   * Get wallet modal.
   *
   * @returns The wallet modal component helper methods.
   */
  async getWalletModal() {
    await this.driver.waitForSelector('.wallet-adapter-modal-list');

    const walletButtons = await this.driver.findElements('.wallet-adapter-modal-list .wallet-adapter-modal-button');

    return {
      connectToMetaMaskWallet: async () => {
        const metamaskButton = await asyncFind(walletButtons, async (button) => (await button.getText()) === 'MetaMask‎');

        if (!metamaskButton) {
          throw new Error('MetaMask button not found');
        }

        await metamaskButton.click()
      },
    }
  }

  /**
   * Get Header.
   *
   * @returns The Header component helper methods.
   */
  async getHeader() {
    await this.waitSelectorTestId(dataTestIds.header.id);

    return {
      setEndpoint: async (endpoint: string) => await this.setInputValue(dataTestIds.header.endpoint, endpoint),
      getConnectionStatus: async () => {
        const element = await this.driver.findElement(this.getElementSelectorTestId(dataTestIds.header.connectionStatus));
        return element.getText();
      },
      connect: async () => await this.clickElement(dataTestIds.header.connect),
      disconnect: async () => await this.clickElement(dataTestIds.header.disconnect),
      getAccount: async () => await this.getSolscanShortContent(dataTestIds.header.account)
    }
  }

  /**
   * Get Faucet tests.
   *
   * @returns The Faucet component helper methods.
   */
  async getFaucetTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.faucet.id);

    return {
      getSol: async () => await this.clickElement(dataTestIds.testPage.faucet.getSol),
      convertSolToWsol: async () => await this.clickElement(dataTestIds.testPage.faucet.convertSolToWsol),
    }
  }

  /**
   * Get Sign Message tests.
   *
   * @returns The Sign Message component helper methods.
   */
  async getSignMessageTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.signMessage.id);

    return {
      setMessage: (message: string) => this.setInputValue(dataTestIds.testPage.signMessage.message, message),
      signMessage: async () => await this.clickElement(dataTestIds.testPage.signMessage.signMessage),
      getSignedMessage: async () => await this.getSignedMessages(dataTestIds.testPage.signMessage.signedMessage),
    }
  }

  /**
   * Get Sign Transaction tests.
   *
   * @returns The Sign Transaction component helper methods.
   */
  async getSendSolTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.sendSol.id);

    return {
      setAddress: (address: string) => this.setInputValue(dataTestIds.testPage.sendSol.address, address),
      signTransaction: async () => await this.clickElement(dataTestIds.testPage.sendSol.signTransaction),
      sendTransaction: async () => await this.clickElement(dataTestIds.testPage.sendSol.sendTransaction),
      getSignedTransaction: async () => await this.getSignedMessages(dataTestIds.testPage.sendSol.signedTransaction),
      getSolscanShortContent: async () => await this.getSolscanShortContent(dataTestIds.testPage.sendSol.transactionHash),
    }
  }

  /**
   * Get Send Sol Versioned tests.
   *
   * @returns The Send Sol Versioned component helper methods.
   */
  async getSendSolVersionedTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.sendSolVersioned.id);

    return {
      setAddress: (address: string) => this.setInputValue(dataTestIds.testPage.sendSolVersioned.address, address),
      signTransaction: async () => await this.clickElement(dataTestIds.testPage.sendSolVersioned.signTransaction),
      sendTransaction: async () => await this.clickElement(dataTestIds.testPage.sendSolVersioned.sendTransaction),
      getSignedTransaction: async () => await this.getSignedMessages(dataTestIds.testPage.sendSolVersioned.signedTransaction),
      getSolscanShortContent: async () => await this.getSolscanShortContent(dataTestIds.testPage.sendSolVersioned.transactionHash),
    }
  }

  /**
   * Get Send Memo tests.
   *
   * @returns The Send Memo component helper methods.
   */
  async getSendMemoTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.sendMemo.id);

    return {
      setMemo: (memo: string) => this.setInputValue(dataTestIds.testPage.sendMemo.memo, memo),
      signTransaction: async () => await this.clickElement(dataTestIds.testPage.sendMemo.signTransaction),
      sendTransaction: async () => await this.clickElement(dataTestIds.testPage.sendMemo.sendTransaction),
      getSignedTransaction: async () => await this.getSignedMessages(dataTestIds.testPage.sendMemo.signedTransaction),
      getSolscanShortContent: async () => await this.getSolscanShortContent(dataTestIds.testPage.sendMemo.transactionHash),
    }
  }

  /**
   * Get Send Wrapped Solana (WSOL) tests.
   *
   * @returns The Send WSOL component helper methods.
   */
  async getSendWSolTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.sendWSol.id);

    return {
      setNbAddresses: (nbAddresses: string) => this.setInputValue(dataTestIds.testPage.sendWSol.nbAddresses, nbAddresses),
      checkMultipleTransaction: (checked: boolean) => this.checkOption(dataTestIds.testPage.sendWSol.multipleTransactions, checked),
      setAmount: (amount: string) => this.setInputValue(dataTestIds.testPage.sendWSol.amount, amount),
      signTransaction: async () => await this.clickElement(dataTestIds.testPage.sendWSol.signTransaction),
      sendTransaction: async () => await this.clickElement(dataTestIds.testPage.sendWSol.sendTransaction),
      getSignedTransactions: async () => await this.getSignedMessages(dataTestIds.testPage.sendWSol.signedTransactions),
      getSolscanShortContents: async () => await this.getSolscanShortContents(dataTestIds.testPage.sendWSol.transactionHashs),
    }
  }

  /**
   * Get Partial Sign tests.
   *
   * @returns The Partial Sign component helper methods.
   */
  async getPartialSignTest() {
    await this.waitSelectorTestId(dataTestIds.testPage.partialSignTransaction.id);

    return {
      signTransaction: async () => await this.clickElement(dataTestIds.testPage.partialSignTransaction.signTransaction),
      getSignedTransaction: async () => await this.getSignedMessages(dataTestIds.testPage.partialSignTransaction.signedTransaction),
    }
  }

  /**
   * Wait for an element to be present in the DOM by its data-testid.
   *
   * @param id - The data-testid of the element to wait for.
   * @returns
   */
  private async waitSelectorTestId(id: string) {
    return this.driver.waitForSelector(this.getElementSelectorTestId(id));
  }

  /**
   * Get the selector for an element by its data-testid.
   *
   * @param id - The data-testid of the element.
   * @returns The CSS selector for the element.
   */
  private getElementSelectorTestId(testId: string) {
    return { testId };
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
   * Set the value of an input element by its data-testid.
   *
   * @param id - The data-testid of the input element.
   * @param value - The value to set in the input element.
   */
  private async setInputValue(id: string, value: string) {
    await this.driver.fill(this.getElementSelectorTestId(id), value);
  }

  /**
   * Check or uncheck an option by its data-testid.
   *
   * @param id - The data-testid of the checkbox element.
   * @param value - Whether to check or uncheck the checkbox.
   */
  private async checkOption(id: string, value: boolean) {
    const element = await this.driver.findElement(this.getElementSelectorTestId(id));
    const isChecked = await element.isSelected()

    if (isChecked !== value) {
      await element.click();
    }
  }

  /**
   * Get signed messages from an element by its data-testid.
   *
   * @param id - The data-testid of the element containing signed messages.
   * @returns An array of signed messages.
   */
  private async getSignedMessages(id: string) {
    const element = await this.driver.findElement(this.getElementSelectorTestId(id));
    const value = await element.getAttribute('value');

    return value.split('\n').map((hash) => hash.trim());
  }

  /**
   * Get the first transaction hash from an element by its data-testid.
   *
   * @param id - The data-testid of the element containing transaction hashes.
   * @returns The first transaction hash.
   */
  private async getSolscanShortContent(id: string) {
    const contents = await this.getSolscanShortContents(id);
    return contents[0];
  }

  /**
   * Get all transaction hashes from an element by its data-testid.
   *
   * @param id - The data-testid of the element containing transaction hashes.
   * @returns An array of transaction hashes.
   */
  private async getSolscanShortContents(id: string) {
    const element = await this.driver.findElement(this.getElementSelectorTestId(id));
    const contents = await element.findElements(By.css('.content'));

    return contents.map((content) => content.getText());
  }
}

/**
 * Asynchronous function to find the first element in an array that satisfies the provided async predicate function.
 *
 * @param array
 * @param asyncPredicate
 * @returns The first element that satisfies the predicate, or undefined if no such element is found.
 */
async function asyncFind<T>(array: T[], asyncPredicate: (item: T) => Promise<boolean>): Promise<T | undefined> {
  for (const item of array) {
    if (await asyncPredicate(item)) {
      return item;
    }
  }
  return undefined;
}