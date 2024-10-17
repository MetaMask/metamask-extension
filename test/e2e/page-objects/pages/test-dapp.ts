import { Driver } from '../../webdriver/driver';
import { WINDOW_TITLES } from '../../helpers';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

class TestDapp {
  private driver: Driver;

  private readonly confirmDepositButton =
    '[data-testid="confirm-footer-button"]';

  private readonly confirmDialogButton = '[data-testid="confirm-btn"]';

  private readonly confirmDialogScrollButton =
    '[data-testid="signature-request-scroll-button"]';

  private readonly confirmSignatureButton =
    '[data-testid="page-container-footer-next"]';

  private readonly connectAccountButton = '#connectButton';

  private readonly connectMetaMaskMessage = {
    text: 'Connect with MetaMask',
    tag: 'h2',
  };

  private readonly connectedAccount = '#accounts';

  private readonly depositPiggyBankContractButton = '#depositButton';

  private readonly editConnectButton = {
    text: 'Edit',
    tag: 'button',
  };

  private readonly erc1155RevokeSetApprovalForAllButton =
    '#revokeERC1155Button';

  private readonly erc1155SetApprovalForAllButton =
    '#setApprovalForAllERC1155Button';

  private readonly erc721RevokeSetApprovalForAllButton = '#revokeButton';

  private readonly erc721SetApprovalForAllButton = '#setApprovalForAllButton';

  private readonly localhostCheckbox = {
    tag: 'p',
    text: 'Localhost 8545',
  };

  private readonly localhostNetworkMessage = {
    css: '#chainId',
    text: '0x539',
  };

  private readonly mmlogo = '#mm-logo';

  private readonly personalSignButton = '#personalSign';

  private readonly personalSignResult = '#personalSignVerifyECRecoverResult';

  private readonly personalSignSignatureRequestMessage = {
    text: 'personal_sign',
    tag: 'div',
  };

  private readonly personalSignVerifyButton = '#personalSignVerify';

  private readonly revokePermissionButton = '#revokeAccountsPermission';

  private readonly signPermitButton = '#signPermit';

  private readonly signPermitResult = '#signPermitResult';

  private readonly signPermitSignatureRequestMessage = {
    text: 'Permit',
    tag: 'p',
  };

  private readonly signPermitVerifyButton = '#signPermitVerify';

  private readonly signPermitVerifyResult = '#signPermitVerifyResult';

  private readonly signTypedDataButton = '#signTypedData';

  private readonly signTypedDataResult = '#signTypedDataResult';

  private readonly signTypedDataSignatureRequestMessage = {
    text: 'Hi, Alice!',
    tag: 'div',
  };

  private readonly signTypedDataV3Button = '#signTypedDataV3';

  private readonly signTypedDataV3Result = '#signTypedDataV3Result';

  private readonly signTypedDataV3V4SignatureRequestMessage = {
    text: 'Hello, Bob!',
    tag: 'div',
  };

  private readonly signTypedDataV3VerifyButton = '#signTypedDataV3Verify';

  private readonly signTypedDataV3VerifyResult = '#signTypedDataV3VerifyResult';

  private readonly signTypedDataV4Button = '#signTypedDataV4';

  private readonly signTypedDataV4Result = '#signTypedDataV4Result';

  private readonly signTypedDataV4VerifyButton = '#signTypedDataV4Verify';

  private readonly signTypedDataV4VerifyResult = '#signTypedDataV4VerifyResult';

  private readonly signTypedDataVerifyButton = '#signTypedDataVerify';

  private readonly signTypedDataVerifyResult = '#signTypedDataVerifyResult';

  private readonly transactionRequestMessage = {
    css: 'h2',
    text: 'Transaction request',
  };

  private readonly updateNetworkButton = {
    text: 'Update',
    tag: 'button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.mmlogo);
    } catch (e) {
      console.log('Timeout while waiting for Test Dapp page to be loaded', e);
      throw e;
    }
    console.log('Test Dapp page is loaded');
  }

  /**
   * Go to the currently open test dapp or open a new test dapp page.
   *
   * @param options - An object containing the contract address and URL of the dapp.
   * @param options.contractAddress - The contract address to open the dapp with. Defaults to null.
   * @param options.url - The URL of the dapp. Defaults to DAPP_URL.
   * @returns A promise that resolves when the page is opened and loaded.
   */
  async openTestDappPage({
    contractAddress = null,
    url = DAPP_URL,
  }: {
    contractAddress?: string | null;
    url?: string;
  } = {}): Promise<void> {
    const handle = await this.driver.windowHandles.switchToWindowIfKnown(
      WINDOW_TITLES.TestDApp,
    );
    if (!handle) {
      const dappUrl = contractAddress
        ? `${url}/?contract=${contractAddress}`
        : url;
      await this.driver.openNewPage(dappUrl);
    }
    await this.check_pageIsLoaded();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async request(method: string, params: any[]) {
    await this.openTestDappPage({
      url: `${DAPP_URL}/request?method=${method}&params=${JSON.stringify(
        params,
      )}`,
    });
  }

  async clickERC721SetApprovalForAllButton() {
    await this.driver.clickElement(this.erc721SetApprovalForAllButton);
  }

  async clickERC1155SetApprovalForAllButton() {
    await this.driver.clickElement(this.erc1155SetApprovalForAllButton);
  }

  async clickERC721RevokeSetApprovalForAllButton() {
    await this.driver.clickElement(this.erc721RevokeSetApprovalForAllButton);
  }

  async clickERC1155RevokeSetApprovalForAllButton() {
    await this.driver.clickElement(this.erc1155RevokeSetApprovalForAllButton);
  }

  /**
   * Connect account to test dapp.
   *
   * @param publicAddress - The public address to connect to test dapp.
   */
  async connectAccount(publicAddress: string) {
    console.log('Connect account to test dapp');
    await this.driver.clickElement(this.connectAccountButton);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(this.connectMetaMaskMessage);

    // TODO:Extra steps needed to preserve the current network.
    // Following steps can be removed once the issue is fixed (#27891)
    const editNetworkButton = await this.driver.findClickableElements(
      this.editConnectButton,
    );
    await editNetworkButton[1].click();
    await this.driver.clickElement(this.localhostCheckbox);
    await this.driver.clickElement(this.updateNetworkButton);

    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmDialogButton,
    );
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.waitForSelector({
      css: this.connectedAccount,
      text: publicAddress.toLowerCase(),
    });
    await this.driver.waitForSelector(this.localhostNetworkMessage);
  }

  async createDepositTransaction() {
    console.log('Create a deposit transaction on test dapp page');
    await this.driver.clickElement(this.depositPiggyBankContractButton);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(this.transactionRequestMessage);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmDepositButton,
    );
  }

  /**
   * Disconnect current connected account from test dapp.
   *
   * @param publicAddress - The public address of the account to disconnect from test dapp.
   */
  async disconnectAccount(publicAddress: string) {
    console.log('Disconnect account from test dapp');
    await this.driver.clickElement(this.revokePermissionButton);
    await this.openTestDappPage();
    await this.driver.refresh();
    await this.check_pageIsLoaded();
    await this.driver.assertElementNotPresent({
      css: this.connectedAccount,
      text: publicAddress.toLowerCase(),
    });
  }

  /**
   * Verify the failed personal sign signature.
   *
   * @param expectedFailedMessage - The expected failed message.
   */
  async check_failedPersonalSign(expectedFailedMessage: string) {
    console.log('Verify failed personal sign signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.waitForSelector({
      css: this.personalSignButton,
      text: expectedFailedMessage,
    });
  }

  /**
   * Verify the failed signPermit signature.
   *
   * @param expectedFailedMessage - The expected failed message.
   */
  async check_failedSignPermit(expectedFailedMessage: string) {
    console.log('Verify failed signPermit signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.waitForSelector({
      css: this.signPermitResult,
      text: expectedFailedMessage,
    });
  }

  /**
   * Verify the failed signTypedData signature.
   *
   * @param expectedFailedMessage - The expected failed message.
   */
  async check_failedSignTypedData(expectedFailedMessage: string) {
    console.log('Verify failed signTypedData signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.waitForSelector({
      css: this.signTypedDataResult,
      text: expectedFailedMessage,
    });
  }

  /**
   * Verify the failed signTypedDataV3 signature.
   *
   * @param expectedFailedMessage - The expected failed message.
   */
  async check_failedSignTypedDataV3(expectedFailedMessage: string) {
    console.log('Verify failed signTypedDataV3 signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.waitForSelector({
      css: this.signTypedDataV3Result,
      text: expectedFailedMessage,
    });
  }

  /**
   * Verify the failed signTypedDataV4 signature.
   *
   * @param expectedFailedMessage - The expected failed message.
   */
  async check_failedSignTypedDataV4(expectedFailedMessage: string) {
    console.log('Verify failed signTypedDataV4 signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.waitForSelector({
      css: this.signTypedDataV4Result,
      text: expectedFailedMessage,
    });
  }

  /**
   * Verify the successful personal sign signature.
   *
   * @param publicKey - The public key to verify the signature with.
   */
  async check_successPersonalSign(publicKey: string) {
    console.log('Verify successful personal sign signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.clickElement(this.personalSignVerifyButton);
    await this.driver.waitForSelector({
      css: this.personalSignResult,
      text: publicKey.toLowerCase(),
    });
  }

  /**
   * Verify the successful signPermit signature.
   *
   * @param publicKey - The public key to verify the signature with.
   */
  async check_successSignPermit(publicKey: string) {
    console.log('Verify successful signPermit signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.clickElement(this.signPermitVerifyButton);
    await this.driver.waitForSelector({
      css: this.signPermitVerifyResult,
      text: publicKey.toLowerCase(),
    });
  }

  /**
   * Verify the successful signTypedData signature.
   *
   * @param publicKey - The public key to verify the signature with.
   */
  async check_successSignTypedData(publicKey: string) {
    console.log('Verify successful signTypedData signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.clickElement(this.signTypedDataVerifyButton);
    await this.driver.waitForSelector({
      css: this.signTypedDataVerifyResult,
      text: publicKey.toLowerCase(),
    });
  }

  /**
   * Verify the successful signTypedDataV3 signature.
   *
   * @param publicKey - The public key to verify the signature with.
   */
  async check_successSignTypedDataV3(publicKey: string) {
    console.log('Verify successful signTypedDataV3 signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.clickElement(this.signTypedDataV3VerifyButton);
    await this.driver.waitForSelector({
      css: this.signTypedDataV3VerifyResult,
      text: publicKey.toLowerCase(),
    });
  }

  /**
   * Verify the successful signTypedDataV4 signature.
   *
   * @param publicKey - The public key to verify the signature with.
   */
  async check_successSignTypedDataV4(publicKey: string) {
    console.log('Verify successful signTypedDataV4 signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.clickElement(this.signTypedDataV4VerifyButton);
    await this.driver.waitForSelector({
      css: this.signTypedDataV4VerifyResult,
      text: publicKey.toLowerCase(),
    });
  }

  /**
   * Sign a message with the personal sign method.
   */
  async personalSign() {
    console.log('Sign message with personal sign');
    await this.driver.clickElement(this.personalSignButton);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(this.personalSignSignatureRequestMessage);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButton,
    );
  }

  /**
   * Sign message with the signPermit method.
   */
  async signPermit() {
    console.log('Sign message with signPermit');
    await this.driver.clickElement(this.signPermitButton);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(this.signPermitSignatureRequestMessage);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButton,
    );
  }

  /**
   * Sign a message with the signTypedData method.
   */
  async signTypedData() {
    console.log('Sign message with signTypedData');
    await this.driver.clickElement(this.signTypedDataButton);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(
      this.signTypedDataSignatureRequestMessage,
    );
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButton,
    );
  }

  /**
   * Sign a message with the signTypedDataV3 method.
   */
  async signTypedDataV3() {
    console.log('Sign message with signTypedDataV3');
    await this.driver.clickElement(this.signTypedDataV3Button);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(
      this.signTypedDataV3V4SignatureRequestMessage,
    );
    await this.driver.clickElementSafe(this.confirmDialogScrollButton, 200);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButton,
    );
  }

  /**
   * Sign a message with the signTypedDataV4 method.
   */
  async signTypedDataV4() {
    console.log('Sign message with signTypedDataV4');
    await this.driver.clickElement(this.signTypedDataV4Button);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(
      this.signTypedDataV3V4SignatureRequestMessage,
    );
    await this.driver.clickElementSafe(this.confirmDialogScrollButton, 200);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButton,
    );
  }
}
export default TestDapp;
