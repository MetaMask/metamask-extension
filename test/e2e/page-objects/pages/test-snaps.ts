import { Driver } from '../../webdriver/driver';
import { TEST_SNAPS_WEBSITE_URL } from '../../snaps/enums';

const inputLocator: { [key: string]: string } = {
  entropyMessageInput: '#entropyMessage',
  messageBip44Input: '#bip44Message',
  messageEd25519Bip32Input: '#bip32Message-ed25519Bip32',
  messageEd25519Input: '#bip32Message-ed25519',
  messageSecp256k1Input: '#bip32Message-secp256k1',
  wasmInput: '#wasmInput',
};

const buttonLocator: { [key: string]: string } = {
  connectBip32Button: '#connectbip32',
  connectBip44Button: '#connectbip44',
  connectClientStatusButton: '#connectclient-status',
  connectDialogsButton: '#connectdialogs',
  connectErrorsButton: '#connecterrors',
  connectGetEntropySnapButton: '#connectGetEntropySnap',
  connectGetFileButton: '#connectgetfile',
  connectHomePageButton: '#connecthomepage',
  connectImagesButton: '#connectimages',
  connectLifeCycleButton: '#connectlifecycle-hooks',
  connectTransactionInsightButton: '#connecttransaction-insights',
  connectUpdateButton: '#connectUpdate',
  connectUpdateNewButton: '#connectUpdateNew',
  connectWasmButton: '#connectwasm',
  dialogsSnapConfirmationButton: '#sendConfirmationButton',
  getAccountButton: '#getAccounts',
  getCompressedKeyButton: '#bip32GetCompressedPublic',
  getPublicKeyButton: '#bip32GetPublic',
  messageSecp256k1Button: '#sendBip32-secp256k1',
  nameLookUpButton: '#connectname-lookup',
  publicKeyBip44Button: '#sendBip44Test',
  sendErrorButton: '#sendError',
  sendGetFileBase64Button: '#sendGetFileBase64Button',
  sendGetFileHexButton: '#sendGetFileHexButton',
  sendGetFileTextButton: '#sendGetFileTextButton',
  sendInsightButton: '#sendInsights',
  sendWasmMessageButton: '#sendWasmMessage',
  signBip44MessageButton: '#signBip44Message',
  signEd25519Bip32MessageButton: '#sendBip32-ed25519Bip32',
  signEd25519MessageButton: '#sendBip32-ed25519',
  signEntropyMessageButton: '#signEntropyMessage',
  submitClientStatusButton: '#sendClientStatusTest',
};

const spanLocator: { [key: string]: string } = {
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
  messageResultEd25519SBip32Span: '#bip32MessageResult-ed25519Bip32',
  updateVersionSpan: '#updateSnapVersion',
  wasmResultSpan: '#wasmResult',
};

const dropDownLocator: { [key: string]: string } = {
  bip32EntropyDropDown: '#bip32-entropy-selector',
  bip44EntropyDropDown: '#bip44-entropy-selector',
  getEntropyDropDown: '#get-entropy-entropy-selector',
};
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

  async scrollAndClickButtonTestSnapsPage(buttonElement: string) {
    const buttonSelector = buttonLocator[buttonElement];
    if (!buttonSelector) {
      throw new Error(`Button element ${buttonElement} not found`);
    }
    console.log(`Finding, scrolling to, and clicking ${buttonElement}`);
    await this.driver.findScrollToAndClickElement(buttonSelector);
  }

  async fillMessageTestSnapsPage(inputElement: string, message: string) {
    console.log(`Filling message in ${inputElement}`);
    const inputField = inputLocator[inputElement];
    await this.driver.fill(inputField, message);
  }

  async signTestSnapsPage(buttonElement: string) {
    console.log(`Click sign button ${buttonElement}`);
    const locator = buttonLocator[buttonElement];
    await this.driver.clickElement(locator);
  }

  async scrollToSignWithEd25519Button() {
    console.log('Scrolling to sign with ed25519 button');
    const sendEd25519 = await this.driver.findElement(
      inputLocator.messageEd25519Input,
    );
    await this.driver.scrollToElement(sendEd25519);
  }

  async check_installationComplete(selector: string, expectedMessage: string) {
    const locator = buttonLocator[selector];
    console.log(`Checking installation is complete - ${expectedMessage}`);
    await this.driver.waitForSelector({
      css: locator,
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
    spanSelectorId: string,
    expectedMessage: string,
  ) {
    const locator = spanLocator[spanSelectorId];
    console.log(
      `Checking the received result against the following expected result: ${expectedMessage}`,
    );
    await this.driver.waitForSelector({
      css: locator,
      text: expectedMessage,
    });
  }

  /**
   * Select an entropy source from the dropdown with the given name.
   *
   * @param dropDownName - The name of the dropdown locator to select the entropy source from.
   * @param name - The name of the entropy source to select.
   */
  async scrollAndSelectEntropySource(dropDownName: string, name: string) {
    let locator: string;
    switch (dropDownName) {
      case 'bip32':
        locator = dropDownLocator.bip32EntropyDropDown;
        break;
      case 'bip44':
        locator = dropDownLocator.bip44EntropyDropDown;
        break;
      case 'getEntropy':
        locator = dropDownLocator.getEntropyDropDown;
        break;
      default:
        throw new Error(`Unknown entropy source type: ${dropDownName}`);
    }
    console.log(`Select ${dropDownName} entropy source`);
    const selector = await this.driver.findElement(locator);
    await this.driver.scrollToElement(selector);
    await this.driver.clickElement(locator);
    await this.driver.clickElement({
      text: name,
      css: `${locator} option`,
    });
  }
}
