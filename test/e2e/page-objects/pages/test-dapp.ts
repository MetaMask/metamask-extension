import { strict as assert } from 'assert';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
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

  private readonly connectAccountButton = '#connectButton';

  private readonly connectedAccount = '#accounts';

  private readonly connectedNetwork = (networkId: string) => ({
    css: '#chainId',
    text: networkId,
  });

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

  private readonly erc20CreateTokenButton = '#createToken';

  private readonly erc20IncreaseTokensAllowanceButton =
    '#increaseTokenAllowance';

  private readonly erc20TokenAddresses = '#erc20TokenAddresses';

  private readonly erc20TokenTransferButton = '#transferTokens';

  private readonly erc20WatchAssetButton = '#watchAssets';

  private readonly erc721ApproveButton = '#approveButton';

  private readonly erc721DeployButton = '#deployNFTsButton';

  private readonly erc721MintButton = '#mintButton';

  private readonly erc721RevokeSetApprovalForAllButton = '#revokeButton';

  private readonly erc721SetApprovalForAllButton = '#setApprovalForAllButton';

  private readonly erc721TokenAddresses = '#erc721TokenAddresses';

  private readonly erc721TokenAddressesWithText = (value: string) => ({
    css: this.erc721TokenAddresses,
    text: value,
  });

  private readonly erc721TransferFromButton = '#transferFromButton';

  private readonly ethSignButton = '#ethSign';

  private readonly ethSignErrorMessage = {
    css: '#ethSign',
    text: 'Error: The method "eth_sign" does not exist / is not available.',
  };

  private readonly ethSubscribeResponse =
    '[data-testid="eth-subscribe-response"]';

  private readonly getAccountsButton = '#getAccounts';

  private readonly getAccountsResult = '#getAccountsResult';

  private readonly getEncryptionKeyButton = '#getEncryptionKeyButton';

  private readonly getEncryptionKeyResult = '#encryptionKeyDisplay';

  private readonly getPermissionsButton = '#getPermissions';

  private readonly getPermissionsResult = '#permissionsResult';

  private readonly maliciousApprovalButton = '#maliciousApprovalButton';

  private readonly maliciousContractInteractionButton =
    '#maliciousContractInteractionButton';

  private readonly maliciousERC20TransferButton =
    '#maliciousERC20TransferButton';

  private readonly maliciousEthTransferButton = '#maliciousRawEthButton';

  private readonly maliciousTradeOrderButton = '#maliciousTradeOrder';

  private readonly mmlogo = '#mm-logo';

  private readonly personalSignButton = '#personalSign';

  private readonly personalSignResult = '#personalSignVerifyECRecoverResult';

  private readonly personalSignVerifyButton = '#personalSignVerify';

  private personalSignSigUtilResultSelector =
    '#personalSignVerifySigUtilResult';

  private readonly personalSignSigUtilResultSelectorWithText = (
    publicKey: string,
  ) => ({
    css: this.personalSignSigUtilResultSelector,
    text: publicKey,
  });

  private readonly piggyBankContract = '#deployButton';

  private readonly provider = '#provider';

  private readonly revokePermissionButton = '#revokeAccountsPermission';

  private readonly sendCallsButton = '#eip5792SendCallsButton';

  private readonly sign721PermitButton = '#sign721Permit';

  private readonly sign721PermitResult = '#sign721PermitResult';

  private readonly sign721PermitResultWithText = (
    expectedSignature: string,
  ) => ({
    css: this.sign721PermitResult,
    text: expectedSignature,
  });

  private readonly sign721PermitResultR = '#sign721PermitResultR';

  private readonly sign721PermitResultRWithText = (expectedR: string) => ({
    css: this.sign721PermitResultR,
    text: `r: ${expectedR}`,
  });

  private readonly sign721PermitResultS = '#sign721PermitResultS';

  private readonly sign721PermitResultSWithText = (expectedS: string) => ({
    css: this.sign721PermitResultS,
    text: `s: ${expectedS}`,
  });

  private readonly sign721PermitResultV = '#sign721PermitResultV';

  private readonly sign721PermitResultVWithText = (expectedV: string) => ({
    css: this.sign721PermitResultV,
    text: `v: ${expectedV}`,
  });

  private readonly sign721PermitVerifyButton = '#sign721PermitVerify';

  private readonly sign721PermitVerifyResult = '#sign721PermitVerifyResult';

  private readonly signPermitButton = '#signPermit';

  private readonly signPermitResult = '#signPermitResult';

  private readonly signPermitResultWithText = (expectedSignature: string) => ({
    css: this.signPermitResult,
    text: expectedSignature,
  });

  private readonly signPermitResultR = '#signPermitResultR';

  private readonly signPermitResultRWithText = (expectedR: string) => ({
    css: this.signPermitResultR,
    text: `r: ${expectedR}`,
  });

  private readonly signPermitResultS = '#signPermitResultS';

  private readonly signPermitResultSWithText = (expectedS: string) => ({
    css: this.signPermitResultS,
    text: `s: ${expectedS}`,
  });

  private readonly signPermitResultV = '#signPermitResultV';

  private readonly signPermitResultVWithText = (expectedV: string) => ({
    css: this.signPermitResultV,
    text: `v: ${expectedV}`,
  });

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

  private readonly signTypedDataResultWithText = (result: string) => ({
    css: this.signTypedDataResult,
    text: result.toLowerCase(),
  });

  private readonly signTypedDataV3Button = '#signTypedDataV3';

  private readonly signTypedDataV3Result = '#signTypedDataV3Result';

  private readonly signTypedDataV3ResultWithText = (result: string) => ({
    css: this.signTypedDataV3Result,
    text: result.toLowerCase(),
  });

  private readonly signTypedDataV3VerifyButton = '#signTypedDataV3Verify';

  private readonly signTypedDataV3VerifyResult = '#signTypedDataV3VerifyResult';

  private readonly signTypedDataV4Button = '#signTypedDataV4';

  private readonly signTypedDataV4Result = '#signTypedDataV4Result';

  private readonly signTypedDataV4ResultWithText = (result: string) => ({
    css: this.signTypedDataV4Result,
    text: result.toLowerCase(),
  });

  private readonly signTypedDataV4VerifyButton = '#signTypedDataV4Verify';

  private readonly signTypedDataV4VerifyResult = '#signTypedDataV4VerifyResult';

  private readonly signTypedDataVerifyButton = '#signTypedDataVerify';

  private readonly signTypedDataVerifyResult = '#signTypedDataVerifyResult';

  private readonly simpleSendButton = '#sendButton';

  private readonly transferTokensWithoutGasButton = '#transferTokensWithoutGas';

  private readonly userRejectedRequestMessage = {
    tag: 'span',
    text: 'Error: User rejected the request.',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private readonly networkSelector = (networkId: string) => ({
    testId: 'chainId',
    text: networkId,
  });

  private readonly networkHost = (host: string) => ({
    css: 'p',
    text: host,
  });

  private readonly connectDappButton = {
    text: 'Connect',
    tag: 'button',
  };

  /**
   * Sends a JSON-RPC request to the connected wallet using window.ethereum.
   *
   * @param method - The RPC method name.
   * @param params - The parameters for the RPC method.
   * @returns The result of the RPC call.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
  async checkConnectedAccounts(
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
  async checkDecryptedMessage(message: string) {
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
  async checkEthSubscribeResponse(
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
  async checkFailedPersonalSign(expectedFailedMessage: string) {
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
  async checkFailedSignPermit(expectedFailedMessage: string) {
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
  async checkFailedSignTypedData(expectedFailedMessage: string) {
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
  async checkFailedSignTypedDataV3(expectedFailedMessage: string) {
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
  async checkFailedSignTypedDataV4(expectedFailedMessage: string) {
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
  async checkGetAccountsResult(expectedResult: string) {
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
  async checkGetEncryptionKeyResult(encryptionKey: string) {
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
  async checkGetPermissionsResult(expectedPermission: string) {
    console.log('Verify get permissions result contains:', expectedPermission);
    await this.driver.waitForElementToStopMoving(this.getPermissionsButton);
    await this.driver.clickElement(this.getPermissionsButton);
    await this.driver.waitForSelector({
      css: this.getPermissionsResult,
      text: expectedPermission,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Wait for Test Dapp page to be loaded');
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
  async checkProviderNumber(expectedNumber: number = 1): Promise<void> {
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
  async checkSuccessPersonalSign(publicKey: string) {
    console.log('Verify successful personal sign signature:', publicKey);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.clickElement(this.personalSignVerifyButton);
    await this.driver.waitForSelector({
      css: this.personalSignResult,
      text: publicKey.toLowerCase(),
    });
  }

  async checkSuccessSign721Permit(publicKey: string) {
    console.log('Verify successful signPermit signature:', publicKey);
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
  async checkSuccessSignPermit(publicKey: string) {
    console.log('Verify successful signPermit signature:', publicKey);
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
  async checkSuccessSignTypedData(publicKey: string) {
    console.log('Verify successful signTypedData signature:', publicKey);
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
  async checkSuccessSignTypedDataV3(publicKey: string) {
    console.log('Verify successful signTypedDataV3 signature:', publicKey);
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
  async checkSuccessSignTypedDataV4(publicKey: string) {
    console.log('Verify successful signTypedDataV4 signature:', publicKey);
    await this.driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await this.driver.clickElement(this.signTypedDataV4VerifyButton);
    await this.driver.waitForSelector({
      css: this.signTypedDataV4VerifyResult,
      text: publicKey.toLowerCase(),
    });
  }

  async checkSuccessSiwe(result: string) {
    console.log('Verify successful SIWE signature:', result);
    await this.driver.waitForSelector({
      css: this.signSiweVerifyResult,
      text: result.toLowerCase(),
    });
  }

  /**
   * Checks the value of a token address once created.
   *
   * @param value - The address to be checked
   */
  async checkTokenAddressesValue(value: string) {
    console.log('Verify token address:', value);
    await this.driver.waitForSelector({
      css: this.erc20TokenAddresses,
      text: value,
    });
  }

  /**
   * Checks the count of token addresses.
   *
   * @param expectedCount - The expected count of token addresses.
   */
  async checkTokenAddressesCount(expectedCount: number) {
    console.log('Check token addresses count:', expectedCount);
    await this.driver.wait(async () => {
      const tokenAddressesElement = await this.driver.findElement(
        this.erc20TokenAddresses,
      );
      const tokenAddresses = await tokenAddressesElement.getText();
      const addresses = tokenAddresses.split(',').filter(Boolean);

      return addresses.length === expectedCount;
    }, 10000);
  }

  /**
   * Checks the value of a ERC-721 token address once created.
   *
   * @param value - The address to be checked
   */
  async checkERC721TokenAddressesValue(value: string) {
    console.log('Verify ERC-721 token address:', value);
    await this.driver.waitForSelector(this.erc721TokenAddressesWithText(value));
  }

  async verifySuccessSignTypedDataResult(result: string) {
    console.log('Verify successful signTypedData result:', result);
    await this.driver.waitForSelector(this.signTypedDataResultWithText(result));
  }

  async verifySuccessSignTypedDataV3Result(result: string) {
    console.log('Verify successful signTypedDataV3 result:', result);
    await this.driver.waitForSelector(
      this.signTypedDataV3ResultWithText(result),
    );
  }

  async verifySuccessSignTypedDataV4Result(result: string) {
    console.log('Verify successful signTypedDataV4 result:', result);
    await this.driver.waitForSelector(
      this.signTypedDataV4ResultWithText(result),
    );
  }

  async verifyPersonalSignSigUtilResult(publicKey: string) {
    console.log('Verify personal sign sigUtil result:', publicKey);
    const sigUtilResult = await this.driver.waitForSelector(
      this.personalSignSigUtilResultSelectorWithText(publicKey),
    );
    assert.ok(
      sigUtilResult,
      `Sig Util result did not match address ${publicKey}`,
    );
  }

  async verifySign721PermitResult(expectedSignature: string) {
    console.log('Verify successful sign721Permit result:', expectedSignature);
    await this.driver.waitForSelector(
      this.sign721PermitResultWithText(expectedSignature),
    );
  }

  async verifySign721PermitResultR(expectedR: string) {
    console.log('Verify successful sign721Permit result R:', expectedR);
    await this.driver.waitForSelector(
      this.sign721PermitResultRWithText(expectedR),
    );
  }

  async verifySign721PermitResultS(expectedS: string) {
    console.log('Verify successful sign721Permit result S:', expectedS);
    await this.driver.waitForSelector(
      this.sign721PermitResultSWithText(expectedS),
    );
  }

  async verifySign721PermitResultV(expectedV: string) {
    console.log('Verify successful sign721Permit result V:', expectedV);
    await this.driver.waitForSelector(
      this.sign721PermitResultVWithText(expectedV),
    );
  }

  async verifySignPermitResult(expectedSignature: string) {
    console.log('Verify successful signPermit result:', expectedSignature);
    await this.driver.waitForSelector(
      this.signPermitResultWithText(expectedSignature),
    );
  }

  async verifySignPermitResultR(expectedR: string) {
    console.log('Verify successful signPermit result R:', expectedR);
    await this.driver.waitForSelector(
      this.signPermitResultRWithText(expectedR),
    );
  }

  async verifySignPermitResultS(expectedS: string) {
    console.log('Verify successful signPermit result S:', expectedS);
    await this.driver.waitForSelector(
      this.signPermitResultSWithText(expectedS),
    );
  }

  async verifySignPermitResultV(expectedV: string) {
    console.log('Verify successful signPermit result V:', expectedV);
    await this.driver.waitForSelector(
      this.signPermitResultVWithText(expectedV),
    );
  }

  async checkEthSignErrorMessage(): Promise<void> {
    console.log('Check ETH sign error message');
    await this.driver.waitForSelector(this.ethSignErrorMessage);
  }

  async assertEip747ContractAddressInputValue(expectedValue: string) {
    console.log('Assert EIP-747 contract address input value:', expectedValue);
    const formFieldEl = await this.driver.findElement(
      this.eip747ContractAddressInput,
    );
    assert.equal(await formFieldEl.getAttribute('value'), expectedValue);
  }

  async assertUserRejectedRequest() {
    console.log('Assert user rejected request');
    await this.driver.waitForSelector(this.userRejectedRequestMessage);
  }

  async clickAddTokenToWallet() {
    console.log('Click add token to wallet button');
    await this.driver.clickElement(this.addTokensToWalletButton);
  }

  async clickAddNetworkButton() {
    console.log('Click add network button');
    await this.driver.clickElement(this.addNetworkButton);
  }

  async clickConnectAccountButton() {
    console.log('Click connect account button');
    await this.driver.clickElement(this.connectAccountButton);
  }

  async clickConnectAccountButtonAndWaitForWindowToClose() {
    console.log('Click connect account button and wait for window to close');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.connectDappButton,
    );
  }

  async clickRevokePermissionButton() {
    console.log('Click revoke permission button');
    await this.driver.clickElement(this.revokePermissionButton);
  }

  async checkDappIsNotConnectedToNetwork(networkId: string) {
    console.log('Check Dapp is not connected to network:', networkId);
    await this.driver.assertElementNotPresent(this.networkSelector(networkId));
  }

  async checkDappHostNetwork(host: string) {
    console.log('Check Dapp host network:', host);
    await this.driver.waitForSelector(this.networkHost(host));
  }

  async clickApproveTokens() {
    console.log('Click approve tokens button');
    await this.driver.clickElement(this.approveTokensButton);
  }

  async clickDecryptButton() {
    console.log('Click decrypt button');
    await this.driver.clickElement(this.decryptButton);
  }

  async clickApproveTokensWithoutGas() {
    console.log('Click approve tokens without gas button');
    await this.driver.clickElement(this.approveTokensButtonWithoutGas);
  }

  async clickERC1155DeployButton() {
    console.log('Click ERC1155 deploy button');
    await this.driver.clickElement(this.erc1155DeployButton);
  }

  async clickERC1155MintButton() {
    console.log('Click ERC1155 mint button');
    await this.driver.clickElement(this.erc1155MintButton);
  }

  async clickERC1155RevokeSetApprovalForAllButton() {
    console.log('Click ERC1155 revoke set approval for all button');
    await this.driver.clickElement(this.erc1155RevokeSetApprovalForAllButton);
  }

  async clickERC1155SetApprovalForAllButton() {
    console.log('Click ERC1155 set approval for all button');
    await this.driver.clickElement(this.erc1155SetApprovalForAllButton);
  }

  async clickERC1155WatchButton() {
    console.log('Click ERC1155 watch button');
    await this.driver.clickElement(this.erc1155WatchButton);
  }

  async clickERC20CreateTokenButton() {
    console.log('Click ERC20 create token button');
    await this.driver.clickElement(this.erc20CreateTokenButton);
  }

  async clickERC20IncreaseAllowanceButton() {
    console.log('Click ERC20 increase allowance button');
    await this.driver.clickElement(this.erc20IncreaseTokensAllowanceButton);
  }

  async clickERC20TokenTransferButton() {
    console.log('Click ERC20 token transfer button');
    await this.driver.waitForSelector(this.erc20TokenTransferButton, {
      state: 'enabled',
    });
    await this.driver.clickElement(this.erc20TokenTransferButton);
  }

  async clickERC20WatchAssetButton() {
    console.log('Click ERC20 watch asset button');
    await this.driver.clickElement(this.erc20WatchAssetButton);
  }

  async clickERC721DeployButton() {
    console.log('Click ERC721 deploy button');
    await this.driver.clickElement(this.erc721DeployButton);
  }

  async clickERC721MintButton() {
    console.log('Click ERC721 mint button');
    await this.driver.clickElement(this.erc721MintButton);
  }

  async clickERC721Permit() {
    console.log('Click ERC721 permit button');
    await this.driver.clickElement(this.sign721PermitButton);
  }

  async clickERC721RevokeSetApprovalForAllButton() {
    console.log('Click ERC721 revoke set approval for all button');
    await this.driver.clickElement(this.erc721RevokeSetApprovalForAllButton);
  }

  async clickERC721ApproveButton() {
    console.log('Click ERC721 approve button');
    await this.driver.clickElement(this.erc721ApproveButton);
  }

  async clickERC721SetApprovalForAllButton() {
    console.log('Click ERC721 set approval for all button');
    await this.driver.clickElement(this.erc721SetApprovalForAllButton);
  }

  async clickERC721TransferFromButton() {
    console.log('Click ERC721 transfer from button');
    await this.driver.clickElement(this.erc721TransferFromButton);
  }

  async clickGetEncryptionKeyButton() {
    console.log('Click get encryption key button');
    await this.driver.clickElement(this.getEncryptionKeyButton);
  }

  async clickPermit() {
    console.log('Click permit button');
    await this.driver.clickElement(this.signPermitButton);
  }

  async clickEthSignButton() {
    console.log('Click eth sign button');
    await this.driver.clickElement(this.ethSignButton);
  }

  async clickPersonalSign() {
    console.log('Click personal sign button');
    await this.driver.clickElement(this.personalSignButton);
  }

  async clickPiggyBankContract() {
    console.log('Click piggy bank contract button');
    await this.driver.clickElement(this.piggyBankContract);
  }

  async clickSendCalls() {
    console.log('Click send calls button');
    await this.driver.clickElement(this.sendCallsButton);
  }

  async clickSignTypedData() {
    console.log('Click sign typed data button');
    await this.driver.clickElement(this.signTypedDataButton);
  }

  async clickSignTypedDatav3() {
    console.log('Click sign typed data v3 button');
    await this.driver.clickElement(this.signTypedDataV3Button);
  }

  async clickSignTypedDatav4() {
    console.log('Click sign typed data v4 button');
    await this.driver.clickElement(this.signTypedDataV4Button);
  }

  async clickSimpleSendButton() {
    console.log('Click simple send button');
    await this.driver.waitForSelector(this.simpleSendButton, {
      state: 'enabled',
    });
    await this.driver.clickElement(this.simpleSendButton);
  }

  async clickSiwe() {
    console.log('Click siwe button');
    await this.driver.clickElement(this.signSiweButton);
  }

  async clickSwieBadDomain() {
    console.log('Click siwe bad domain button');
    await this.driver.clickElement(this.signSiweBadDomainButton);
  }

  async clickTransferTokens() {
    console.log('Click transfer tokens button');
    await this.driver.clickElement(this.erc20TokenTransferButton);
  }

  async clickTransferTokensWithoutGas() {
    console.log('Click transfer tokens without gas button');
    await this.driver.clickElement(this.transferTokensWithoutGasButton);
  }

  async clickMaliciousERC20TransferButton() {
    console.log('Click malicious ERC20 transfer button');
    await this.driver.clickElement(this.maliciousERC20TransferButton);
  }

  async clickMaliciousApprovalButton() {
    console.log('Click malicious approval button');
    await this.driver.clickElement(this.maliciousApprovalButton);
  }

  async clickMaliciousContractInteractionButton() {
    console.log('Click malicious contract interaction button');
    await this.driver.clickElement(this.maliciousContractInteractionButton);
  }

  async clickMaliciousEthTransferButton() {
    console.log('Click malicious ETH transfer button');
    await this.driver.clickElement(this.maliciousEthTransferButton);
  }

  async clickMaliciousTradeOrderButton() {
    console.log('Click malicious trade order button');
    await this.driver.clickElement(this.maliciousTradeOrderButton);
  }

  /**
   * Click connect account button in test dapp.
   * Note: Dialog handling should be done separately in test files or use connectAccountToTestDapp flow helper.
   */
  async connectAccount() {
    console.log('Connect account in test dapp');
    await this.clickConnectAccountButton();
  }

  async createDepositTransaction() {
    console.log('Create a deposit transaction on test dapp page');
    await this.driver.clickElement(this.depositPiggyBankContractButton);
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
    await this.checkPageIsLoaded();
    await this.checkConnectedAccounts(publicAddress, false);
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
    console.log(`Fill ERC1155 token amount: ${amount}`);
    await this.driver.pasteIntoField(this.erc1155TokenAmountInput, amount);
  }

  async fillERC1155TokenID(tokenID: string) {
    console.log(`Fill ERC1155 token ID: ${tokenID}`);
    await this.driver.pasteIntoField(this.erc1155TokenIDInput, tokenID);
  }

  /**
   * Scrolls to the create token button and clicks it.
   */
  async clickCreateToken() {
    console.log('Click create token button');
    await this.driver.clickElement(this.erc20CreateTokenButton);
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
    console.log(`Open test dapp page: ${dappUrl}`);
    await this.driver.openNewPage(dappUrl);
  }

  async pasteIntoEip747ContractAddressInput() {
    console.log('Paste into EIP-747 contract address input');
    await this.driver.findElement(this.eip747ContractAddressInput);
    await this.driver.pasteFromClipboardIntoField(
      this.eip747ContractAddressInput,
    );
  }

  /**
   * Click personal sign button in test dapp.
   * Note: Dialog handling should be done separately in test files.
   */
  async personalSign() {
    console.log('Sign message with personal sign');
    await this.clickPersonalSign();
  }

  /**
   * Click permit sign button in test dapp.
   * Note: Dialog handling should be done separately in test files.
   */
  async signPermit() {
    console.log('Sign message with signPermit');
    await this.clickPermit();
  }

  /**
   * Click sign typed data button in test dapp.
   * Note: Dialog handling should be done separately in test files.
   */
  async signTypedData() {
    console.log('Sign message with signTypedData');
    await this.clickSignTypedData();
  }

  /**
   * Check if the test dapp is connected to the specified network.
   *
   * @param networkId - The network id to check if the test dapp is connected to.
   */
  async checkNetworkIsConnected(networkId: string) {
    console.log(`Check testdapp is connected to network ${networkId}`);
    await this.driver.waitForSelector(this.connectedNetwork(networkId));
  }

  /**
   * Verify account connection and chain ID in test dapp.
   * Should be called after switching back to TestDApp window.
   *
   * @param publicAddress - The public address to verify.
   * @param chainId - The chain id to verify, defaults to 0x539.
   */
  async verifyAccountConnection(
    publicAddress: string,
    chainId: string = '0x539',
  ): Promise<void> {
    console.log(
      `Verify account ${publicAddress} is connected to chain ${chainId}`,
    );
    await this.checkConnectedAccounts(publicAddress);
    await this.driver.waitForSelector(this.connectedNetwork(chainId));
  }
}

export default TestDapp;
