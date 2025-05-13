import { isEqual } from 'lodash';
import { Driver } from '../../webdriver/driver';
import { TEST_SNAPS_WEBSITE_URL } from '../../snaps/enums';

const inputLocator = {
  entropyMessageInput: '#entropyMessage',
  messageBip44Input: '#bip44Message',
  messageEd25519Bip32Input: '#bip32Message-ed25519Bip32',
  messageEd25519Input: '#bip32Message-ed25519',
  messageSecp256k1Input: '#bip32Message-secp256k1',
  wasmInput: '#wasmInput',
} satisfies Record<string, string>;

export const buttonLocator = {
  connectBip32Button: '#connectbip32',
  connectBip44Button: '#connectbip44',
  connectClientStatusButton: '#connectclient-status',
  connectDialogsButton: '#connectdialogs',
  connectErrorsButton: '#connecterrors',
  connectGetEntropyButton: '#connectGetEntropySnap',
  connectGetFileButton: '#connectgetfile',
  connectHomePageButton: '#connecthomepage',
  connectInteractiveButton: '#connectinteractive-ui',
  connectImagesButton: '#connectimages',
  connectLifeCycleButton: '#connectlifecycle-hooks',
  connectNameLookUpButton: '#connectname-lookup',
  connectPreinstalledButton: '#connectpreinstalled-snap',
  connectTransactionInsightButton: '#connecttransaction-insights',
  connectUpdateButton: '#connectUpdate',
  connectUpdateNewButton: '#connectUpdateNew',
  connectWasmButton: '#connectwasm',
  connectNotificationButton: '#connectnotifications',
  confirmationButton: '#sendConfirmationButton',
  createDialogButton: '#createDialogButton',
  createDialogDisabledButton: '#createDisabledDialogButton',
  getAccountButton: '#getAccounts',
  getBip32CompressedPublicKeyButton: '#bip32GetCompressedPublic',
  getBip32PublicKeyButton: '#bip32GetPublic',
  getPreferencesConnectButton: '#connectpreferences',
  getPreferencesSubmitButton: '#getPreferences',
  getSettingsStateButton: '#settings-state',
  publicKeyBip44Button: '#sendBip44Test',
  sendErrorButton: '#sendError',
  sendExpandedViewNotificationButton: '#sendExpandedViewNotification',
  sendInAppNotificationButton: '#sendInAppNotification',
  sendGetFileBase64Button: '#sendGetFileBase64Button',
  sendGetFileHexButton: '#sendGetFileHexButton',
  sendGetFileTextButton: '#sendGetFileTextButton',
  sendInsightButton: '#sendInsights',
  sendWasmMessageButton: '#sendWasmMessage',
  signBip32messageSecp256k1Button: '#sendBip32-secp256k1',
  signBip44MessageButton: '#signBip44Message',
  signEd25519Bip32MessageButton: '#sendBip32-ed25519Bip32',
  signEd25519MessageButton: '#sendBip32-ed25519',
  signEntropyMessageButton: '#signEntropyMessage',
  submitClientStatusButton: '#sendClientStatusTest',
} satisfies Record<string, string>;

const spanLocator = {
  bip32MessageResultEd25519Span: '#bip32MessageResult-ed25519',
  bip32MessageResultSecp256k1Span: '#bip32MessageResult-secp256k1',
  bip32PublicKeyResultSpan: '#bip32PublicKeyResult',
  bip32ResultSpan: '#bip32Result',
  bip44ResultSpan: '#bip44Result',
  bip44SignResultSpan: '#bip44SignResult',
  clientStatusResultSpan: '#clientStatusResult',
  entropySignResultSpan: '#entropySignResult',
  errorResultSpan: '#errorResult',
  fileResultSpan: '#getFileResult',
  installedSnapResultSpan: '#installedSnapsResult',
  interactiveUIResultSpan: '#interactiveUIResult',
  messageResultEd25519SBip32Span: '#bip32MessageResult-ed25519Bip32',
  preferencesResultSpan: '#preferencesResult',
  rpcResultSpan: '#rpcResult',
  updateVersionSpan: '#updateSnapVersion',
  wasmResultSpan: '#wasmResult',
} satisfies Record<string, string>;

const dropDownLocator = {
  bip32EntropyDropDown: '#bip32-entropy-selector',
  bip44EntropyDropDown: '#bip44-entropy-selector',
  getEntropyDropDown: '#get-entropy-entropy-selector',
} satisfies Record<string, string>;
export class TestSnaps {
  driver: Driver;

  private readonly installedSnapsHeader = '[data-testid="InstalledSnaps"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openPage() {
    console.log('Opening Test Snap Dapp page');
    await this.driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
    await this.driver.waitForSelector(this.installedSnapsHeader);
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.installedSnapsHeader,
        buttonLocator.connectBip32Button,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Test Snap Dapp page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Test Snap Dapp page is loaded');
  }

  async check_clientStatus(expectedStatus: string): Promise<void> {
    console.log(`Checking that the client status should be ${expectedStatus}`);
    await this.driver.waitForSelector({
      css: spanLocator.clientStatusResultSpan,
      text: expectedStatus,
    });
  }

  async scrollAndClickButton(buttonElement: keyof typeof buttonLocator) {
    console.log(`Finding, scrolling to, and clicking ${buttonElement}`);
    await this.driver.findScrollToAndClickElement(buttonLocator[buttonElement]);
  }

  async fillMessage(inputElement: keyof typeof inputLocator, message: string) {
    console.log(`Filling message in ${inputElement}`);
    await this.driver.fill(inputLocator[inputElement], message);
  }

  async clickButton(buttonElement: keyof typeof buttonLocator) {
    console.log(`Clicking button ${buttonElement}`);
    await this.driver.clickElement(buttonLocator[buttonElement]);
  }

  async scrollToButton(buttonElement: keyof typeof buttonLocator) {
    console.log(`Scrolling button ${buttonElement}`);
    const buttonSelector = await this.driver.findElement(
      buttonLocator[buttonElement],
    );
    await this.driver.scrollToElement(buttonSelector);
  }

  async check_installationComplete(
    selector: keyof typeof buttonLocator,
    expectedMessage: string,
  ) {
    console.log(`Checking installation is complete - ${expectedMessage}`);
    await this.driver.waitForSelector({
      css: buttonLocator[selector],
      text: expectedMessage,
    });
  }

  async check_installedSnapsResult(expectedMessage: string) {
    console.log('Checking installed snaps, result section on the top left');
    await this.driver.waitForSelector({
      css: spanLocator.installedSnapResultSpan,
      text: expectedMessage,
    });
  }

  async check_messageResultSpan(
    spanSelectorId: keyof typeof spanLocator,
    expectedMessage: string,
  ) {
    console.log(
      `Checking the received result against the following expected result: ${expectedMessage}`,
    );
    await this.driver.waitForSelector({
      css: spanLocator[spanSelectorId],
      text: expectedMessage,
    });
  }

  /**
   * Select an entropy source from the dropdown with the given name.
   *
   * @param dropDownName - The name of the dropdown locator to select the entropy source from.
   * @param name - The name of the entropy source to select.
   */
  async scrollAndSelectEntropySource(
    dropDownName: keyof typeof dropDownLocator,
    name: string,
  ) {
    const locator = dropDownLocator[dropDownName];
    console.log(`Select ${dropDownName} entropy source`);
    const selector = await this.driver.findElement(locator);
    await this.driver.scrollToElement(selector);
    await this.driver.clickElement(locator);
    await this.driver.clickElement({
      text: name,
      css: `${locator} option`,
    });
  }

  /**
   * Validate the preferences result span JSON response.
   *
   * @param expectedPreferences - The expected preferences object to validate against.
   * @param expectedPreferences.locale
   * @param expectedPreferences.currency
   * @param expectedPreferences.hideBalances
   * @param expectedPreferences.useSecurityAlerts
   * @param expectedPreferences.useExternalPricingData
   * @param expectedPreferences.simulateOnChainActions
   * @param expectedPreferences.useTokenDetection
   * @param expectedPreferences.batchCheckBalances
   * @param expectedPreferences.displayNftMedia
   * @param expectedPreferences.useNftDetection
   */
  async check_preferencesResult(expectedPreferences: {
    locale: string;
    currency: string;
    hideBalances: boolean;
    useSecurityAlerts: boolean;
    useExternalPricingData: boolean;
    simulateOnChainActions: boolean;
    useTokenDetection: boolean;
    batchCheckBalances: boolean;
    displayNftMedia: boolean;
    useNftDetection: boolean;
  }) {
    console.log('Validating preferences result span JSON response');

    const element = await this.driver.findElement(
      spanLocator.preferencesResultSpan,
    );
    const spanText = await element.getAttribute('textContent');
    const actualPreferences = JSON.parse(spanText);

    console.log(`Actual preferences: ${JSON.stringify(actualPreferences)}`);
    console.log(`Expected preferences: ${JSON.stringify(expectedPreferences)}`);

    if (!isEqual(actualPreferences, expectedPreferences)) {
      throw new Error(
        'Preferences result span JSON does not match expected values',
      );
    }
    console.log('Preferences result span JSON is valid');
  }
}
