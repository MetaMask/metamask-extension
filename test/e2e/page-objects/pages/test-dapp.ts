import { strict as assert } from 'assert';
import { WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';

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

  private readonly simpleSendButton = '#sendButton';

  private readonly erc721MintButton = '#mintButton';

  private readonly erc721TransferFromButton = '#transferFromButton';

  private readonly erc1155TokenIDInput = '#batchMintTokenIds';

  private readonly erc1155TokenAmountInput = '#batchMintIdAmounts';

  private readonly erc1155MintButton = '#batchMintButton';

  private readonly erc1155WatchButton = '#watchAssetButton';

  private readonly erc1155RevokeSetApprovalForAllButton =
    '#revokeERC1155Button';

  private readonly erc1155SetApprovalForAllButton =
    '#setApprovalForAllERC1155Button';

  private readonly erc20WatchAssetButton = '#watchAssets';

  private readonly erc721RevokeSetApprovalForAllButton = '#revokeButton';

  private readonly erc721SetApprovalForAllButton = '#setApprovalForAllButton';

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

  private personalSignSigUtilResultSelector =
    '#personalSignVerifySigUtilResult';

  private readonly revokePermissionButton = '#revokeAccountsPermission';

  private readonly signPermitButton = '#signPermit';

  private readonly signPermitResult = '#signPermitResult';

  private readonly signPermitSignatureRequestMessage = {
    text: 'Permit',
    tag: 'p',
  };

  private readonly signPermitVerifyButton = '#signPermitVerify';

  private readonly signPermitVerifyResult = '#signPermitVerifyResult';

  private readonly signPermitResultR = '#signPermitResultR';

  private readonly signPermitResultS = '#signPermitResultS';

  private readonly signPermitResultV = '#signPermitResultV';

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

  private readonly signSiweButton = '#siwe';

  private readonly signSiweVerifyResult = '#siweResult';

  private readonly signSiweBadDomainButton = '#siweBadDomain';

  private readonly sign721PermitButton = '#sign721Permit';

  private sign721PermitVerifyButton = '#sign721PermitVerify';

  private sign721PermitVerifyResult = '#sign721PermitVerifyResult';

  private sign721PermitResult = '#sign721PermitResult';

  private sign721PermitResultR = '#sign721PermitResultR';

  private sign721PermitResultS = '#sign721PermitResultS';

  private sign721PermitResultV = '#sign721PermitResultV';

  private readonly eip747ContractAddressInput = '#eip747ContractAddress';

  private readonly transactionRequestMessage = {
    text: 'Transaction request',
    tag: 'h2',
  };

  private readonly updateNetworkButton = {
    text: 'Update',
    tag: 'button',
  };

  private readonly userRejectedRequestMessage = {
    tag: 'span',
    text: 'Error: User rejected the request.',
  };

  private erc20TokenTransferButton = '#transferTokens';

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
   * Open the test dapp page.
   *
   * @param options - The options for opening the test dapp page.
   * @param options.contractAddress - The contract address to open the dapp with. Defaults to null.
   * @param options.url - The URL of the dapp. Defaults to DAPP_URL.
   * @returns A promise that resolves when the new page is opened.
   */
  async openTestDappPage({
    contractAddress = null,
    url = DAPP_URL,
  }: {
    contractAddress?: string | null;
    url?: string;
  } = {}): Promise<void> {
    const dappUrl = contractAddress
      ? `${url}/?contract=${contractAddress}`
      : url;
    await this.driver.openNewPage(dappUrl);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async request(method: string, params: any[]) {
    await this.openTestDappPage({
      url: `${DAPP_URL}/request?method=${method}&params=${JSON.stringify(
        params,
      )}`,
    });
  }

  async clickSimpleSendButton() {
    await this.driver.clickElement(this.simpleSendButton);
  }

  async clickERC721MintButton() {
    await this.driver.clickElement(this.erc721MintButton);
  }

  async clickERC721TransferFromButton() {
    await this.driver.clickElement(this.erc721TransferFromButton);
  }

  async fillERC1155TokenID(tokenID: string) {
    await this.driver.pasteIntoField(this.erc1155TokenIDInput, tokenID);
  }

  async fillERC1155TokenAmount(amount: string) {
    await this.driver.pasteIntoField(this.erc1155TokenAmountInput, amount);
  }

  async clickERC1155MintButton() {
    await this.driver.clickElement(this.erc1155MintButton);
  }

  async clickERC1155WatchButton() {
    await this.driver.clickElement(this.erc1155WatchButton);
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

  public async clickERC20WatchAssetButton() {
    await this.driver.clickElement(this.erc20WatchAssetButton);
  }

  public async clickERC20TokenTransferButton() {
    await this.driver.clickElement(this.erc20TokenTransferButton);
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

  async verifyPersonalSignSigUtilResult(publicKey: string) {
    const sigUtilResult = await this.driver.waitForSelector({
      css: this.personalSignSigUtilResultSelector,
      text: publicKey,
    });
    assert.ok(
      sigUtilResult,
      `Sig Util result did not match address ${publicKey}`,
    );
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

  async verifySignPermitResult(expectedSignature: string) {
    await this.driver.waitForSelector({
      css: this.signPermitResult,
      text: expectedSignature,
    });
  }

  async verifySignPermitResultR(expectedR: string) {
    await this.driver.waitForSelector({
      css: this.signPermitResultR,
      text: `r: ${expectedR}`,
    });
  }

  async verifySignPermitResultS(expectedS: string) {
    await this.driver.waitForSelector({
      css: this.signPermitResultS,
      text: `s: ${expectedS}`,
    });
  }

  async verifySignPermitResultV(expectedV: string) {
    await this.driver.waitForSelector({
      css: this.signPermitResultV,
      text: `v: ${expectedV}`,
    });
  }

  async check_successSign721Permit(publicKey: string) {
    console.log('Verify successful signPermit signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.clickElement(this.sign721PermitVerifyButton);
    await this.driver.waitForSelector({
      css: this.sign721PermitVerifyResult,
      text: publicKey.toLowerCase(),
    });
  }

  async verifySign721PermitResult(expectedSignature: string) {
    await this.driver.waitForSelector({
      css: this.sign721PermitResult,
      text: expectedSignature,
    });
  }

  async verifySign721PermitResultR(expectedR: string) {
    await this.driver.waitForSelector({
      css: this.sign721PermitResultR,
      text: `r: ${expectedR}`,
    });
  }

  async verifySign721PermitResultS(expectedS: string) {
    await this.driver.waitForSelector({
      css: this.sign721PermitResultS,
      text: `s: ${expectedS}`,
    });
  }

  async verifySign721PermitResultV(expectedV: string) {
    await this.driver.waitForSelector({
      css: this.sign721PermitResultV,
      text: `v: ${expectedV}`,
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

  async verify_successSignTypedDataResult(result: string) {
    await this.driver.waitForSelector({
      css: this.signTypedDataResult,
      text: result.toLowerCase(),
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

  async verify_successSignTypedDataV3Result(result: string) {
    await this.driver.waitForSelector({
      css: this.signTypedDataV3Result,
      text: result.toLowerCase(),
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

  async verify_successSignTypedDataV4Result(result: string) {
    await this.driver.waitForSelector({
      css: this.signTypedDataV4Result,
      text: result.toLowerCase(),
    });
  }

  async check_successSiwe(result: string) {
    console.log('Verify successful SIWE signature');
    await this.driver.waitForSelector({
      css: this.signSiweVerifyResult,
      text: result.toLowerCase(),
    });
  }

  async clickPersonalSign() {
    await this.driver.clickElement(this.personalSignButton);
  }

  async clickSignTypedData() {
    await this.driver.clickElement(this.signTypedDataButton);
  }

  async clickSignTypedDatav3() {
    await this.driver.clickElement(this.signTypedDataV3Button);
  }

  async clickSignTypedDatav4() {
    await this.driver.clickElement(this.signTypedDataV4Button);
  }

  async clickPermit() {
    await this.driver.clickElement(this.signPermitButton);
  }

  async clickSiwe() {
    await this.driver.clickElement(this.signSiweButton);
  }

  async clickSwieBadDomain() {
    await this.driver.clickElement(this.signSiweBadDomainButton);
  }

  async clickERC721Permit() {
    await this.driver.clickElement(this.sign721PermitButton);
  }

  /**
   * Sign a message with the personal sign method.
   */
  async personalSign() {
    console.log('Sign message with personal sign');
    await this.clickPersonalSign();
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
    await this.clickPermit();
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
    await this.clickSignTypedData();
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
    await this.clickSignTypedDatav3();
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
    await this.clickSignTypedDatav4();
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(
      this.signTypedDataV3V4SignatureRequestMessage,
    );
    await this.driver.clickElementSafe(this.confirmDialogScrollButton, 200);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButton,
    );
  }

  async pasteIntoEip747ContractAddressInput() {
    await this.driver.findElement(this.eip747ContractAddressInput);
    await this.driver.pasteFromClipboardIntoField(
      this.eip747ContractAddressInput,
    );
  }

  async assertEip747ContractAddressInputValue(expectedValue: string) {
    const formFieldEl = await this.driver.findElement(
      this.eip747ContractAddressInput,
    );
    assert.equal(await formFieldEl.getAttribute('value'), expectedValue);
  }

  async assertUserRejectedRequest() {
    await this.driver.waitForSelector(this.userRejectedRequestMessage);
  }
}
export default TestDapp;
