import { strict as assert } from 'assert';
import { DAPP_URL } from '../../constants';
import { WINDOW_TITLES } from '../../helpers';
import { Driver } from '../../webdriver/driver';

class TestDapp {
  private readonly driver: Driver;

  private readonly addTokensToWalletButton = {
    text: 'Add Token(s) to Wallet',
    tag: 'button',
  };

  private readonly addNetworkButton = '#addEthereumChain';

  private readonly approveTokensButton = '#approveTokens';

  private readonly approveTokensButtonWithoutGas = '#approveTokensWithoutGas';

  private readonly confirmDepositButton =
    '[data-testid="confirm-footer-button"]';

  private readonly confirmDialogButton = '[data-testid="confirm-btn"]';

  private readonly confirmDialogScrollButton =
    '[data-testid="signature-request-scroll-button"]';

  private readonly confirmScrollToBottomButtonRedesign =
    '.confirm-scroll-to-bottom__button';

  private readonly confirmSignatureButtonRedesign =
    '[data-testid="confirm-footer-button"]';

  private readonly connectAccountButton = '#connectButton';

  private readonly connectMetaMaskMessage = {
    text: 'Connect this website with MetaMask',
    tag: 'p',
  };

  private readonly connectedAccount = '#accounts';

  private readonly createTokenButton = { text: 'Create Token', tag: 'button' };

  private readonly decryptButton = '#decryptButton';

  private readonly decryptedMessage = '#cleartextDisplay';

  private readonly depositPiggyBankContractButton = '#depositButton';

  private readonly eip5792SendCallsError = '#eip5792SendCallsError';

  private readonly eip747ContractAddressInput = '#eip747ContractAddress';

  private readonly encryptButton = '#encryptButton';

  private readonly encryptedMessage = '#ciphertextDisplay';

  private readonly encryptMessageInput = '#encryptMessageInput';

  private readonly erc1155DeployButton = '#deployERC1155Button';

  private readonly erc1155MintButton = '#batchMintButton';

  private readonly erc1155RevokeSetApprovalForAllButton =
    '#revokeERC1155Button';

  private readonly erc1155SetApprovalForAllButton =
    '#setApprovalForAllERC1155Button';

  private readonly erc1155TokenAmountInput = '#batchMintIdAmounts';

  private readonly erc1155TokenIDInput = '#batchMintTokenIds';

  private readonly erc1155WatchButton = '#watchAssetButton';

  private readonly erc20TokenAddresses = '#erc20TokenAddresses';

  private readonly erc20TokenTransferButton = '#transferTokens';

  private readonly erc20WatchAssetButton = '#watchAssets';

  private readonly erc721DeployButton = '#deployNFTsButton';

  private readonly erc721MintButton = '#mintButton';

  private readonly erc721RevokeSetApprovalForAllButton = '#revokeButton';

  private readonly erc721SetApprovalForAllButton = '#setApprovalForAllButton';

  private readonly erc721TransferFromButton = '#transferFromButton';

  private readonly ethSubscribeResponse =
    '[data-testid="eth-subscribe-response"]';

  private readonly getAccountsButton = '#getAccounts';

  private readonly getAccountsResult = '#getAccountsResult';

  private readonly getEncryptionKeyButton = '#getEncryptionKeyButton';

  private readonly getEncryptionKeyResult = '#encryptionKeyDisplay';

  private readonly getPermissionsButton = '#getPermissions';

  private readonly getPermissionsResult = '#permissionsResult';

  private readonly localhostNetworkMessage = { css: '#chainId', text: '0x539' };

  private readonly mmlogo = '#mm-logo';

  private maliciousERC20TransferButton = '#maliciousERC20TransferButton';

  private readonly ethSignButton = '#ethSign';

  private readonly ethSignErrorMessage = {
    css: '#ethSign',
    text: 'Error: The method "eth_sign" does not exist / is not available.',
  };

  private readonly personalSignButton = '#personalSign';

  private readonly personalSignResult = '#personalSignVerifyECRecoverResult';

  private readonly personalSignVerifyButton = '#personalSignVerify';

  private personalSignSigUtilResultSelector =
    '#personalSignVerifySigUtilResult';

  private readonly provider = '#provider';

  private readonly revokePermissionButton = '#revokeAccountsPermission';

  private readonly sign721PermitButton = '#sign721Permit';

  private readonly sendCallsButton = '#eip5792SendCallsButton';

  private sign721PermitResult = '#sign721PermitResult';

  private sign721PermitResultR = '#sign721PermitResultR';

  private sign721PermitResultS = '#sign721PermitResultS';

  private sign721PermitResultV = '#sign721PermitResultV';

  private sign721PermitVerifyButton = '#sign721PermitVerify';

  private sign721PermitVerifyResult = '#sign721PermitVerifyResult';

  private readonly signPermitButton = '#signPermit';

  private readonly signPermitResult = '#signPermitResult';

  private readonly signPermitResultR = '#signPermitResultR';

  private readonly signPermitResultS = '#signPermitResultS';

  private readonly signPermitResultV = '#signPermitResultV';

  private readonly signPermitSignatureRequestMessage = {
    text: 'Permit',
    tag: 'p',
  };

  private readonly signPermitVerifyButton = '#signPermitVerify';

  private readonly signPermitVerifyResult = '#signPermitVerifyResult';

  private readonly signSiweBadDomainButton = '#siweBadDomain';

  private readonly signSiweButton = '#siwe';

  private readonly signSiweVerifyResult = '#siweResult';

  private readonly signTypedDataButton = '#signTypedData';

  private readonly signTypedDataResult = '#signTypedDataResult';

  private readonly signTypedDataV3Button = '#signTypedDataV3';

  private readonly signTypedDataV3Result = '#signTypedDataV3Result';

  private readonly signTypedDataV3V4SignatureRequestMessage = {
    text: 'Hello, Bob!',
    tag: 'div',
  };

  private readonly signTypedDataV3V4SignatureRequestMessageRedesign = {
    text: 'Hello, Bob!',
    tag: 'p',
  };

  private readonly signTypedDataV3VerifyButton = '#signTypedDataV3Verify';

  private readonly signTypedDataV3VerifyResult = '#signTypedDataV3VerifyResult';

  private readonly signTypedDataV4Button = '#signTypedDataV4';

  private readonly signTypedDataV4Result = '#signTypedDataV4Result';

  private readonly signTypedDataV4VerifyButton = '#signTypedDataV4Verify';

  private readonly signTypedDataV4VerifyResult = '#signTypedDataV4VerifyResult';

  private readonly signTypedDataVerifyButton = '#signTypedDataVerify';

  private readonly signTypedDataVerifyResult = '#signTypedDataVerifyResult';

  private readonly simpleSendButton = '#sendButton';

  private readonly transactionRequestMessage = {
    text: 'Transaction request',
    tag: 'h2',
  };

  private transferTokensButton = '#transferTokens';

  private transferTokensWithoutGasButton = '#transferTokensWithoutGas';

  private readonly userRejectedRequestMessage = {
    tag: 'span',
    text: 'Error: User rejected the request.',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Sends a JSON-RPC request to the connected wallet using window.ethereum.
   *
   * @param method - The RPC method name.
   * @param params - The parameters for the RPC method.
   * @returns The result of the RPC call.
   */
  async request<T>(method: string, params?: unknown[] | object): Promise<T> {
    console.log(`Sending request: ${method}`, params);
    return await this.driver.executeScript(
      'return window.ethereum.request(arguments[0])',
      [
        {
          method,
          params,
        },
      ],
    );
  }

  /**
   * Verifies the accounts connected to the test dapp.
   *
   * @param connectedAccounts - Account addresses to check if connected to test dapp, separated by a comma.
   * @param shouldBeConnected - Whether the accounts should be connected to test dapp. Defaults to true.
   */
  async check_connectedAccounts(
    connectedAccounts: string,
    shouldBeConnected: boolean = true,
  ) {
    if (shouldBeConnected) {
      console.log('Verify connected accounts:', connectedAccounts);
      await this.driver.waitForSelector({
        css: this.connectedAccount,
        text: connectedAccounts.toLowerCase(),
      });
    } else {
      console.log('Verify accounts not connected:', connectedAccounts);
      await this.driver.assertElementNotPresent({
        css: this.connectedAccount,
        text: connectedAccounts.toLowerCase(),
      });
    }
  }

  /**
   * Verify the decrypted message on test dapp.
   *
   * @param message - The decrypted message to verify.
   */
  async check_decryptedMessage(message: string) {
    console.log('Verify decrypted message on test dapp');
    await this.driver.waitForSelector({
      css: this.decryptedMessage,
      text: message,
    });
  }

  /**
   * Verify the EIP-5792 send calls error message on the test dapp.
   *
   * @param expectedMessage - The expected error message to verify.
   */
  async checkEip5792SendCallsError(expectedMessage: string) {
    await this.driver.waitForSelector({
      css: this.eip5792SendCallsError,
      text: expectedMessage,
    });
  }

  /**
   * Verifies the eth_subscribe response.
   *
   * @param shouldBePresent - Whether the eth_subscribe response should be present, defaults to true.
   * @param guardTime - Time to wait to check if the eth_subscribe response is present, defaults to 1000ms.
   */
  async check_ethSubscribeResponse(
    shouldBePresent: boolean = true,
    guardTime: number = 1000,
  ) {
    if (shouldBePresent) {
      console.log('Verify eth_subscribe response is displayed');
      await this.driver.waitForSelector(this.ethSubscribeResponse);
    } else {
      console.log('Verify eth_subscribe response is not displayed');
      await this.driver.assertElementNotPresent(this.ethSubscribeResponse, {
        waitAtLeastGuard: guardTime,
      });
    }
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
   * Verify get connected accounts result.
   *
   * @param expectedResult - The expected account address.
   */
  async check_getAccountsResult(expectedResult: string) {
    console.log(
      'Verify get connected accounts result contains:',
      expectedResult,
    );
    await this.driver.clickElement(this.getAccountsButton);
    await this.driver.waitForSelector({
      css: this.getAccountsResult,
      text: expectedResult,
    });
  }

  /**
   * Verify the get encryption key result.
   *
   * @param encryptionKey - The encryption key to display.
   */
  async check_getEncryptionKeyResult(encryptionKey: string) {
    console.log(
      'Verify get encryption key result on test dapp: ',
      encryptionKey,
    );
    await this.driver.waitForSelector({
      css: this.getEncryptionKeyResult,
      text: encryptionKey,
    });
  }

  /**
   * Verify get permissions result.
   *
   * @param expectedPermission - The expected displayed permission.
   */
  async check_getPermissionsResult(expectedPermission: string) {
    console.log('Verify get permissions result contains:', expectedPermission);
    await this.driver.waitForElementToStopMoving(this.getPermissionsButton);
    await this.driver.clickElement(this.getPermissionsButton);
    await this.driver.waitForSelector({
      css: this.getPermissionsResult,
      text: expectedPermission,
    });
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
   * Verify the number of providers displayed in the test dapp.
   *
   * @param expectedNumber - The expected number of providers to be displayed. Defaults to 1.
   */
  async check_providerNumber(expectedNumber: number = 1): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} providers to be displayed in test dapp`,
    );
    await this.driver.wait(async () => {
      const providers = await this.driver.findElements(this.provider);
      return providers.length === expectedNumber;
    }, 10000);
    console.log(`${expectedNumber} providers found in test dapp`);
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

  async check_successSign721Permit(publicKey: string) {
    console.log('Verify successful signPermit signature');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.clickElement(this.sign721PermitVerifyButton);
    await this.driver.waitForSelector({
      css: this.sign721PermitVerifyResult,
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

  async check_successSiwe(result: string) {
    console.log('Verify successful SIWE signature');
    await this.driver.waitForSelector({
      css: this.signSiweVerifyResult,
      text: result.toLowerCase(),
    });
  }

  /**
   * Checks the count of token addresses.
   *
   * @param expectedCount - The expected count of token addresses.
   */
  async check_TokenAddressesCount(expectedCount: number) {
    console.log(`checking token addresses count: ${expectedCount}`);
    await this.driver.wait(async () => {
      const tokenAddressesElement = await this.driver.findElement(
        this.erc20TokenAddresses,
      );
      const tokenAddresses = await tokenAddressesElement.getText();
      const addresses = tokenAddresses.split(',').filter(Boolean);

      return addresses.length === expectedCount;
    }, 10000);
  }

  async verify_successSignTypedDataResult(result: string) {
    await this.driver.waitForSelector({
      css: this.signTypedDataResult,
      text: result.toLowerCase(),
    });
  }

  async verify_successSignTypedDataV3Result(result: string) {
    await this.driver.waitForSelector({
      css: this.signTypedDataV3Result,
      text: result.toLowerCase(),
    });
  }

  async verify_successSignTypedDataV4Result(result: string) {
    await this.driver.waitForSelector({
      css: this.signTypedDataV4Result,
      text: result.toLowerCase(),
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

  async check_ethSignErrorMessage(): Promise<void> {
    await this.driver.waitForSelector(this.ethSignErrorMessage);
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

  async clickAddTokenToWallet() {
    await this.driver.clickElement(this.addTokensToWalletButton);
  }

  async clickAddNetworkButton() {
    await this.driver.clickElement(this.addNetworkButton);
  }

  async clickConnectAccountButton() {
    await this.driver.clickElement(this.connectAccountButton);
  }

  async clickApproveTokens() {
    await this.driver.clickElement(this.approveTokensButton);
  }

  async clickDecryptButton() {
    await this.driver.clickElement(this.decryptButton);
  }

  async clickApproveTokensWithoutGas() {
    await this.driver.clickElement(this.approveTokensButtonWithoutGas);
  }

  async clickERC1155DeployButton() {
    await this.driver.clickElement(this.erc1155DeployButton);
  }

  async clickERC1155MintButton() {
    await this.driver.clickElement(this.erc1155MintButton);
  }

  async clickERC1155RevokeSetApprovalForAllButton() {
    await this.driver.clickElement(this.erc1155RevokeSetApprovalForAllButton);
  }

  async clickERC1155SetApprovalForAllButton() {
    await this.driver.clickElement(this.erc1155SetApprovalForAllButton);
  }

  async clickERC1155WatchButton() {
    await this.driver.clickElement(this.erc1155WatchButton);
  }

  async clickERC20TokenTransferButton() {
    await this.driver.clickElement(this.erc20TokenTransferButton);
  }

  async clickERC20WatchAssetButton() {
    await this.driver.clickElement(this.erc20WatchAssetButton);
  }

  async clickERC721DeployButton() {
    await this.driver.clickElement(this.erc721DeployButton);
  }

  async clickERC721MintButton() {
    await this.driver.clickElement(this.erc721MintButton);
  }

  async clickERC721Permit() {
    await this.driver.clickElement(this.sign721PermitButton);
  }

  async clickERC721RevokeSetApprovalForAllButton() {
    await this.driver.clickElement(this.erc721RevokeSetApprovalForAllButton);
  }

  async clickERC721SetApprovalForAllButton() {
    await this.driver.clickElement(this.erc721SetApprovalForAllButton);
  }

  async clickERC721TransferFromButton() {
    await this.driver.clickElement(this.erc721TransferFromButton);
  }

  async clickGetEncryptionKeyButton() {
    await this.driver.clickElement(this.getEncryptionKeyButton);
  }

  async clickPermit() {
    await this.driver.clickElement(this.signPermitButton);
  }

  async clickEthSignButton() {
    await this.driver.clickElement(this.ethSignButton);
  }

  async clickPersonalSign() {
    await this.driver.clickElement(this.personalSignButton);
  }

  async clickSendCalls() {
    await this.driver.clickElement(this.sendCallsButton);
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

  async clickSimpleSendButton() {
    await this.driver.waitForSelector(this.simpleSendButton, {
      state: 'enabled',
    });
    await this.driver.clickElement(this.simpleSendButton);
  }

  async clickSiwe() {
    await this.driver.clickElement(this.signSiweButton);
  }

  async clickSwieBadDomain() {
    await this.driver.clickElement(this.signSiweBadDomainButton);
  }

  async clickTransferTokens() {
    await this.driver.clickElement(this.transferTokensButton);
  }

  async clickTransferTokensWithoutGas() {
    await this.driver.clickElement(this.transferTokensWithoutGasButton);
  }

  async confirmConnectAccountModal() {
    console.log('Confirm connect account modal in notification window');
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(this.connectMetaMaskMessage);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmDialogButton,
    );
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  }

  async clickMaliciousERC20TransferButton() {
    const sendTransactionButton = await this.driver.findElement(
      this.maliciousERC20TransferButton,
    );
    await this.driver.scrollToElement(sendTransactionButton);
    await this.driver.clickElement(this.maliciousERC20TransferButton);
  }

  /**
   * Connect account to test dapp.
   *
   * @param options - Options for connecting account to test dapp.
   * @param [options.connectAccountButtonEnabled] - Indicates if the connect account button should be enabled.
   * @param options.publicAddress - The public address to connect to test dapp.
   * @param [options.chainId] - The chain id to connect to, defaults to 0x539.
   */
  async connectAccount({
    connectAccountButtonEnabled = true,
    publicAddress,
    chainId = '0x539',
  }: {
    connectAccountButtonEnabled?: boolean;
    publicAddress?: string;
    chainId?: string;
  }) {
    console.log('Connect account to test dapp');
    await this.clickConnectAccountButton();
    if (connectAccountButtonEnabled) {
      await this.confirmConnectAccountModal();
    } else {
      await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
      await this.driver.waitForSelector(this.connectMetaMaskMessage);
      const confirmConnectDialogButton = await this.driver.findElement(
        this.confirmDialogButton,
      );
      assert.equal(await confirmConnectDialogButton.isEnabled(), false);
    }
    if (publicAddress) {
      await this.check_connectedAccounts(publicAddress);
      await this.driver.waitForSelector({
        css: '#chainId',
        text: chainId,
      });
    }
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
    await this.check_connectedAccounts(publicAddress, false);
  }

  /**
   * Encrypt a message on test dapp.
   *
   * @param message - The message to encrypt.
   */
  async encryptMessage(message: string) {
    console.log(`Encrypt message ${message} in test dapp`);
    await this.driver.fill(this.encryptMessageInput, message);
    await this.driver.clickElement(this.encryptButton);
    await this.driver.waitForSelector({
      css: this.encryptedMessage,
      text: '0x',
    });
  }

  async fillERC1155TokenAmount(amount: string) {
    await this.driver.pasteIntoField(this.erc1155TokenAmountInput, amount);
  }

  async fillERC1155TokenID(tokenID: string) {
    await this.driver.pasteIntoField(this.erc1155TokenIDInput, tokenID);
  }

  /**
   * Scrolls to the create token button and clicks it.
   */
  async findAndClickCreateToken() {
    const createTokenElement = await this.driver.findElement(
      this.createTokenButton,
    );
    await this.driver.scrollToElement(createTokenElement);
    await this.driver.clickElement(this.createTokenButton);
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

  async pasteIntoEip747ContractAddressInput() {
    await this.driver.findElement(this.eip747ContractAddressInput);
    await this.driver.pasteFromClipboardIntoField(
      this.eip747ContractAddressInput,
    );
  }

  /**
   * Sign a message with the personal sign method.
   */
  async personalSign() {
    console.log('Sign message with personal sign');
    await this.clickPersonalSign();
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButtonRedesign,
    );
  }

  /**
   * Sign message with the signPermit method.
   */
  async signPermit() {
    console.log('Sign message with signPermit');
    await this.clickPermit();
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButtonRedesign,
    );
  }

  /**
   * Sign a message with the signTypedData method.
   */
  async signTypedData() {
    console.log('Sign message with signTypedData');
    await this.clickSignTypedData();
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButtonRedesign,
    );
  }

  async signTypedDataV3Redesign() {
    await this.clickSignTypedDatav3();
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await this.driver.waitForSelector(
      this.signTypedDataV3V4SignatureRequestMessageRedesign,
    );
    await this.driver.clickElementSafe(
      this.confirmScrollToBottomButtonRedesign,
      200,
    );
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButtonRedesign,
    );
  }

  /**
   * Sign a message with the signTypedDataV4 method.
   *
   */
  async signTypedDataV4() {
    console.log('Sign message with signTypedDataV4');
    await this.clickSignTypedDatav4();
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

    await this.driver.waitForSelector(
      this.signTypedDataV3V4SignatureRequestMessageRedesign,
    );
    await this.driver.clickElementSafe(
      this.confirmScrollToBottomButtonRedesign,
      200,
    );
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmSignatureButtonRedesign,
    );
  }
}

export default TestDapp;
