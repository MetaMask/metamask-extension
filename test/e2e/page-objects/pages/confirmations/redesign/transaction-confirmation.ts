import { strict as assert } from 'assert';
import { By, Key } from 'selenium-webdriver';
import { tEn } from '../../../../../lib/i18n-helpers';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import Confirmation from './confirmation';

class TransactionConfirmation extends Confirmation {
  private readonly advancedDetailsButton: RawLocator = `[data-testid="header-advanced-details-button"]`;

  private readonly advancedDetailsDataFunction: RawLocator =
    '[data-testid="advanced-details-data-function"]';

  private readonly advancedDetailsDataParam: RawLocator =
    '[data-testid="advanced-details-data-param-0"]';

  private readonly advancedDetailsHexData: RawLocator =
    '[data-testid="advanced-details-transaction-hex"]';

  private readonly advancedDetailsSection: RawLocator =
    '[data-testid="advanced-details-data-section"]';

  private readonly advancedGasFeeEdit: RawLocator =
    '[data-testid="advanced-gas-fee-edit"]';

  private readonly advancedGasSet: RawLocator = { tag: 'p', text: 'Advanced' };

  private readonly alertBanner: RawLocator =
    '[data-testid="confirm-banner-alert"]';

  private readonly customNonceButton: RawLocator =
    '[data-testid="edit-nonce-icon"]';

  private readonly customNonceInput: RawLocator =
    '[data-testid="custom-nonce-input"]';

  private readonly dappInitiatedHeadingTitle: RawLocator = {
    css: 'h4',
    text: tEn('transferRequest') as string,
  };

  private readonly editGasFeeIcon: RawLocator =
    '[data-testid="edit-gas-fee-icon"]';

  private readonly editGasFeeItemCustom: RawLocator =
    '[data-testid="edit-gas-fee-item-custom"]';

  private readonly gasFeeCloseToastMessage: RawLocator =
    '.toasts-container__banner-base button[aria-label="Close"]';

  private readonly gasFeeFiatText: RawLocator =
    '[data-testid="native-currency"]';

  private readonly paidByMetaMaskNotice: RawLocator =
    '[data-testid="paid-by-meta-mask"]';

  private readonly gasFeeText: RawLocator = '[data-testid="first-gas-field"]';

  private readonly gasFeeTokenArrow: RawLocator =
    '[data-testid="selected-gas-fee-token-arrow"]';

  private readonly gasFeeTokenFeeText: RawLocator =
    '[data-testid="gas-fee-token-fee"]';

  private readonly gasFeeTokenPill: RawLocator =
    '[data-testid="selected-gas-fee-token"]';

  private readonly gasInputs: RawLocator = 'input[type="number"]';

  private readonly gasLimitInput: RawLocator =
    '[data-testid="gas-limit-input"]';

  private readonly headerAccountName: RawLocator =
    '[data-testid="header-account-name"]';

  private readonly networkName: RawLocator =
    '[data-testid="confirmation__details-network-name"]';

  private readonly saveButton: RawLocator = { tag: 'button', text: 'Save' };

  private readonly senderAccount: RawLocator = '[data-testid="sender-address"]';

  private readonly walletInitiatedHeadingTitle: RawLocator = {
    css: 'h4',
    text: tEn('review') as string,
  };

  private readonly shieldFooterCoverageIndicator = (status: string) => ({
    css: '[data-alert-key="shieldFooterCoverageIndicator"]',
    text: status,
  });

  private readonly simulationDetailsLayout: RawLocator =
    '[data-testid="simulation-details-layout"]';

  private readonly estimatedSimulationDetails = (type: string): RawLocator => {
    if (type === '') {
      return this.simulationDetailsLayout;
    }

    return {
      css: this.simulationDetailsLayout.toString(),
      text: type,
    };
  };

  private readonly outgoingIncomingSimulationDetails = (
    isOutgoing: boolean,
    index: number,
  ): RawLocator => {
    const listTestId = isOutgoing
      ? 'simulation-rows-outgoing'
      : 'simulation-rows-incoming';
    const id = index + 1;
    const css = `[data-testid="${listTestId}"] [data-testid="simulation-details-balance-change-row"]:nth-child(${id})`;
    console.log(`Locator for outgoing/incoming simulation details: ${css}`);

    return css;
  };

  private readonly dappNumberConnected = (dappNumber: string) =>
    By.xpath(`//p[normalize-space(.)='${dappNumber}']`);

  constructor(driver: Driver) {
    super(driver);
    this.driver = driver;
  }

  async expectBalanceChange({
    isOutgoing,
    index,
    displayAmount,
    assetName,
  }: {
    isOutgoing: boolean;
    index: number;
    displayAmount: string;
    assetName: string;
  }) {
    console.log(
      `Checking balance change ${isOutgoing} ${index} with text ${displayAmount} ${assetName} is displayed on transaction confirmation page.`,
    );
    const css = this.outgoingIncomingSimulationDetails(isOutgoing, index);

    console.log(
      `Checking balance change ${css.toString()} with text ${displayAmount} is displayed on transaction confirmation page.`,
    );
    await this.driver.findElement({
      css,
      text: displayAmount,
    });

    console.log(
      `Checking balance change ${css.toString()} with text ${assetName}  is displayed on transaction confirmation page.`,
    );
    await this.driver.findElement({
      css,
      text: assetName,
    });
  }

  async checkEstimatedSimulationDetails(type: string) {
    console.log(
      `Checking estimated simulation details ${type} is displayed on transaction confirmation page.`,
    );
    await this.driver.waitForSelector(this.estimatedSimulationDetails(type));
  }

  async checkEstimatedSimulationDetailsNotDisplayed(waitAtLeastGuard: number) {
    console.log(
      `Checking estimated simulation details not displayed on transaction confirmation page.`,
    );
    await this.driver.assertElementNotPresent(
      this.estimatedSimulationDetails(''),
      { waitAtLeastGuard },
    );
  }

  /**
   * Checks if the alert message is displayed on the transaction confirmation page.
   *
   * @param message - The message to check.
   */
  async checkAlertMessageIsDisplayed(message: string) {
    console.log(
      `Checking alert message ${message} is displayed on transaction confirmation page.`,
    );
    await this.driver.waitForSelector({
      css: this.alertBanner,
      text: message,
    });
  }

  async checkDappInitiatedHeadingTitle() {
    await this.driver.waitForSelector(this.dappInitiatedHeadingTitle);
  }

  async checkGasFee(amountToken: string) {
    await this.driver.findElement({
      css: this.gasFeeText,
      text: amountToken,
    });
  }

  async checkGasFeeFiat(amountFiat: string) {
    await this.driver.findElement({
      css: this.gasFeeFiatText,
      text: amountFiat,
    });
  }

  async checkGasFeeSymbol(symbol: string) {
    await this.driver.waitForSelector({
      css: this.gasFeeTokenPill,
      text: symbol,
    });
  }

  async checkGasFeeTokenFee(amountFiat: string) {
    await this.driver.findElement({
      css: this.gasFeeTokenFeeText,
      text: amountFiat,
    });
  }

  async checkHeaderAccountNameIsDisplayed(account: string): Promise<void> {
    console.log(
      `Checking header account name ${account} on transaction confirmation page.`,
    );
    await this.driver.waitForSelector({
      css: this.headerAccountName,
      text: account,
    });
  }

  async checkPaidByMetaMask() {
    await this.driver.findElement({
      css: this.paidByMetaMaskNotice,
      text: tEn('paidByMetaMask') as string,
    });
  }

  /**
   * Checks that the sender account is displayed on the transaction confirmation page.
   *
   * @param account - The sender account to check.
   */
  async checkSenderAccountIsDisplayed(account: string): Promise<void> {
    console.log(
      `Checking sender account ${account} on transaction confirmation page.`,
    );
    await this.driver.waitForSelector({
      css: this.senderAccount,
      text: account,
    });
  }

  /**
   * Check the number of dapps connected
   *
   * @param numberOfDapps - The number of dapps connected
   */
  async checkNumberOfDappsConnected(numberOfDapps: string) {
    await this.driver.waitForSelector(this.dappNumberConnected(numberOfDapps));
  }

  async checkNetworkIsDisplayed(network: string): Promise<void> {
    console.log(
      `Checking network ${network} is displayed on transaction confirmation page.`,
    );
    await this.driver.waitForSelector({
      css: this.networkName,
      text: network,
    });
  }

  async checkNetworkIsNotDisplayed(network: string): Promise<void> {
    console.log(
      `Checking network ${network} is not displayed on transaction confirmation page.`,
    );
    await this.driver.assertElementNotPresent(
      { css: this.networkName, text: network },
      {
        waitAtLeastGuard: 1000,
      },
    );
  }

  async checkNoAlertMessageIsDisplayed() {
    console.log(
      `Checking no alert message is displayed on transaction confirmation page.`,
    );
    await this.driver.assertElementNotPresent(this.alertBanner, {
      waitAtLeastGuard: 1000,
    });
  }

  async checkSendAmount(amount: string) {
    console.log(
      `Checking send amount ${amount} on transaction confirmation page.`,
    );
    await this.driver.waitForSelector({
      text: amount,
      tag: 'h2',
    });
  }

  async checkWalletInitiatedHeadingTitle() {
    await this.driver.waitForSelector(this.walletInitiatedHeadingTitle);
  }

  async clickAdvancedDetailsButton() {
    // Instead of clicking the button, we use sendKeys to avoid flakiness when a tooltip appears overlaying the button
    const advancedDetailsButton = await this.driver.findElement(
      this.advancedDetailsButton,
    );
    await advancedDetailsButton.sendKeys(Key.ENTER);
  }

  async clickCustomNonceButton() {
    await this.driver.clickElement(this.customNonceButton);
  }

  async clickGasFeeTokenPill() {
    await this.driver.clickElement(this.gasFeeTokenArrow);
  }

  async clickSaveButton() {
    await this.driver.clickElement(this.saveButton);
  }

  async closeGasFeeToastMessage() {
    // the toast message automatically disappears after some seconds, so we need to use clickElementSafe to prevent race conditions
    await this.driver.clickElementSafe(this.gasFeeCloseToastMessage, 10000);
  }

  /**
   * Opens the gas fee modal by clicking the edit gas fee icon.
   */
  async openGasFeeModal(): Promise<void> {
    await this.driver.clickElement(this.editGasFeeIcon);
  }

  /**
   * Edits the gas fee by setting custom gas limit and price values
   *
   * @param gasLimit - The gas limit value to set
   * @param gasPrice - The gas price value to set
   */
  async editGasFeeLegacy(gasLimit: string, gasPrice: string): Promise<void> {
    console.log('Editing gas fee values');

    await this.driver.clickElement(this.editGasFeeIcon);

    const inputs = await this.driver.findElements(this.gasInputs);
    const [gasLimitInput, gasPriceInput] = inputs;

    await gasLimitInput.clear();
    await gasLimitInput.sendKeys(gasLimit);
    await gasPriceInput.clear();
    await gasPriceInput.sendKeys(gasPrice);

    await this.driver.clickElement(this.saveButton);

    console.log('Gas fee values updated successfully');
  }

  /**
   * Sets a custom gas limit in the London (EIP-1559) advanced gas settings.
   *
   * @param gasLimit - Gas limit to set (as a string)
   */
  async editGasLimitLondon(gasLimit: string): Promise<void> {
    await this.driver.clickElement(this.editGasFeeIcon);
    await this.driver.clickElement(this.editGasFeeItemCustom);
    await this.driver.clickElement(this.advancedGasFeeEdit);
    await this.driver.fill(this.gasLimitInput, gasLimit);
    await this.driver.clickElement(this.saveButton);
    await this.driver.waitForSelector(this.advancedGasSet);
    console.log('Gas fee values updated successfully');
  }

  async fillCustomNonce(nonce: string) {
    await this.driver.fill(this.customNonceInput, nonce);
  }

  /**
   * Gets the network name displayed on the transaction confirmation page.
   *
   * IMPORTANT: Make sure the transaction confirmation screen is fully loaded
   * before calling this method to avoid race conditions, as the network name element
   * might not be present or updated correctly immediately after navigation.
   *
   * @returns The network name.
   */
  async getNetworkName(): Promise<string> {
    const networkNameElement = await this.driver.findElement(this.networkName);
    const networkName = await networkNameElement.getText();
    console.log(
      'Current network name displayed on transaction confirmation page: ',
      networkName,
    );
    return networkName;
  }

  /**
   * Gets the sender account name displayed on the transaction confirmation page.
   *
   * IMPORTANT: Make sure the transaction confirmation screen is fully loaded
   * before calling this method to avoid race conditions.
   *
   * @returns The sender account name.
   */
  async getSenderAccountName(): Promise<string> {
    const senderAccountElement = await this.driver.findElement(
      this.senderAccount,
    );
    const senderAccountName = await senderAccountElement.getText();
    console.log(
      'Current sender account name displayed on transaction confirmation page: ',
      senderAccountName,
    );
    return senderAccountName;
  }

  async setCustomNonce(nonce: string) {
    await this.clickCustomNonceButton();
    await this.fillCustomNonce(nonce);
    await this.clickSaveButton();
  }

  async verifyAdvancedDetailsHexDataIsDisplayed(hexData: string) {
    await this.driver.waitForSelector({
      css: this.advancedDetailsHexData,
      text: hexData,
    });
  }

  async verifyAdvancedDetailsIsDisplayed(type: string) {
    await this.driver.waitForSelector(this.advancedDetailsSection);

    await this.driver.waitForSelector({
      css: this.advancedDetailsDataFunction,
      text: 'mintNFTs',
    });

    if (type === '4Bytes') {
      await this.driver.waitForSelector({
        css: this.advancedDetailsDataParam,
        text: 'Param #1',
      });
    } else if (type === 'Sourcify') {
      await this.driver.waitForSelector({
        css: this.advancedDetailsDataParam,
        text: 'Number Of Tokens',
      });
    }

    await this.driver.waitForSelector({
      css: this.advancedDetailsDataParam,
      text: '1',
    });
  }

  async verifyUniswapDecodedTransactionAdvancedDetails() {
    const dataSections = await this.driver.findElements(
      this.advancedDetailsDataFunction,
    );

    const expectedData = [
      {
        functionName: 'WRAP_ETH',
        recipient: '0x00000...00002',
        amountMin: '100000000000000',
      },
      {
        functionName: 'V3_SWAP_EXACT_IN',
        recipient: '0x00000...00002',
        amountIn: '100000000000000',
        amountOutMin: '312344',
        path0: 'WETH',
        path1: '500',
        path2: 'USDC',
        payerIsUser: 'false',
      },
      {
        functionName: 'PAY_PORTION',
        token: 'USDC',
        recipient: '0x27213...71c47',
        bips: '25',
      },
      {
        functionName: 'SWEEP',
        token: 'USDC',
        recipient: '0x00000...00001',
        amountMin: '312344',
      },
    ];

    assert.strictEqual(
      dataSections.length,
      expectedData.length,
      'Mismatch between data sections and expected data count.',
    );

    await Promise.all(
      dataSections.map(async (dataSection, sectionIndex) => {
        await dataSection.isDisplayed();

        const data = expectedData[sectionIndex];

        const functionText = await dataSection.getText();
        assert.ok(
          functionText.includes(data.functionName),
          `Expected function name '${data.functionName}' in advanced details.`,
        );

        const params = `[data-testid="advanced-details-${functionText}-params"]`;

        const paramsData = await this.driver.findElement(params);
        const paramText = await paramsData.getText();

        for (const [key, expectedValue] of Object.entries(data)) {
          if (key === 'functionName') {
            continue;
          }
          assert.ok(
            paramText.includes(expectedValue),
            `Expected ${key} '${expectedValue}' in data section ${functionText}.`,
          );

          this.clickScrollToBottomButton();
        }
      }),
    );
  }

  async checkShieldCoverage(
    status: 'covered' | 'not_covered' | 'malicious',
  ): Promise<void> {
    const statusText =
      status === 'covered'
        ? (tEn('shieldCovered') as string)
        : (tEn('shieldNotCovered') as string);
    console.log(`Checking if shield coverage indicator shows "${statusText}"`);
    await this.driver.waitForSelector(
      this.shieldFooterCoverageIndicator(statusText),
    );
  }
}

export default TransactionConfirmation;
